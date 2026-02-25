import https from 'node:https';
import { URL } from 'node:url';
import crypto from 'node:crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as consumers from 'node:stream/consumers';
import { acquireCacheLock, storeResultInMysql, getResultFromMysql, cleanupInFlightEntry } from './mysql-cache.mjs';
import { getCachedResponse, setCachedResponse, waitForInFlightRequestLocal } from './local-cache.mjs';

// Cache TTL in seconds (default: 30 seconds)
const CACHE_TTL = parseInt(process.env.API_PROXY_CACHE_TTL) || 30;

// API Keys cache (loaded from S3)
let apiKeysCache = null;
let apiKeysCacheTime = 0;
const API_KEYS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Initialize S3 client (uses Lambda execution role credentials)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Log module initialization to verify it loads
console.log('API Proxy module loaded successfully');

// Generate cache key from request
const generateCacheKey = (method, url, queryParams) => {
  const keyData = `${method}:${url}:${JSON.stringify(queryParams || {})}`;
  return crypto.createHash('md5').update(keyData).digest('hex');
};

// Parse API mappings from environment variable
// Format: "bloomberg:bb-finance.p.rapidapi.com,yahoo:yahoo-finance15.p.rapidapi.com,seeking-alpha:seeking-alpha.p.rapidapi.com"
const parseApiMappings = () => {
  const mappings = {};
  const apiMappingsStr = process.env.API_MAPPINGS || '';

  if (apiMappingsStr) {
    apiMappingsStr.split(',').forEach((mapping) => {
      const [name, host] = mapping.trim().split(':');
      if (name && host) {
        mappings[name] = host;
      }
    });
  }

  return mappings;
};

// Build target URL
const buildTargetUrl = (apiHost, path, queryParams) => {
  // Remove the api name from the path
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length >= 1) {
    // Remove api name from path
    const apiPath = '/' + pathParts.slice(1).join('/');

    // Build URL with query parameters
    const url = new URL(apiPath, `https://${apiHost}`);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url;
  }

  return null;
};

// Load API keys from S3
const loadApiKeysFromS3 = async () => {
  const now = Date.now();

  // Return cached keys if still valid
  if (apiKeysCache && now - apiKeysCacheTime < API_KEYS_CACHE_TTL) {
    return apiKeysCache;
  }

  const bucket = process.env.API_KEYS_S3_BUCKET;
  const key = process.env.API_KEYS_DECRYPTED_S3_KEY || 'api-keys/decrypted-keys.json';

  if (!bucket) {
    console.warn('API_KEYS_S3_BUCKET not set, skipping S3 key loading');
    return null;
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);

    // Read and parse JSON
    const text = await consumers.text(response.Body);
    const keys = JSON.parse(text);

    apiKeysCache = keys;
    apiKeysCacheTime = now;

    // Handle both old format (Record) and new format (array)
    const keyCount = Array.isArray(keys) ? keys.length : Object.keys(keys).length;
    console.log(`Loaded ${keyCount} API keys from S3`);
    return keys;
  } catch (error) {
    // If file doesn't exist, log warning but don't fail
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      console.warn(`API keys file not found in S3: ${bucket}/${key}`);
      return null;
    }
    console.error('Error loading API keys from S3:', error);
    // Return null on error - will fall back to API_PROXY_KEY if set
    return null;
  }
};

// Load JSON from S3 for dummy/mock responses
const loadJsonFromS3 = async (s3Key) => {
  const bucket = process.env.DUMMY_DATA_S3_BUCKET || process.env.API_KEYS_S3_BUCKET;

  if (!bucket) {
    throw new Error('DUMMY_DATA_S3_BUCKET or API_KEYS_S3_BUCKET not configured');
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
    const response = await s3Client.send(command);

    // Read and parse JSON
    const text = await consumers.text(response.Body);
    const data = JSON.parse(text);

    console.log(`Loaded JSON from S3: ${bucket}/${s3Key}`);
    return data;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      throw new Error(`Dummy data file not found in S3: ${bucket}/${s3Key}`);
    }
    console.error('Error loading JSON from S3:', error);
    throw error;
  }
};

// Verify API key - check if it matches any key in S3
const verifyApiKey = async (providedApiKey) => {
  if (!providedApiKey) {
    return false;
  }

  // Try to load keys from S3
  const apiKeys = await loadApiKeysFromS3();

  if (!apiKeys) {
    // Fallback to environment variable if S3 keys not available
    const requiredApiKey = process.env.API_PROXY_KEY;
    if (requiredApiKey) {
      return providedApiKey === requiredApiKey;
    }
    // No authentication configured
    return false;
  }

  // Handle both old format (Record) and new format (array)
  let keyValues;
  if (Array.isArray(apiKeys)) {
    // New format: array of objects with api_key field
    keyValues = apiKeys.filter((entry) => entry.api_key).map((entry) => entry.api_key);
  } else {
    // Old format: Record<string, string>
    keyValues = Object.values(apiKeys);
  }

  return keyValues.includes(providedApiKey);
};

// Make HTTP request using built-in modules
const makeRequest = (url, method, headers, body) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers,
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
};

export const handler = async (event) => {
  try {
    console.log('Proxy event:', JSON.stringify(event, null, 2));

    // Authenticate request with API key
    const incomingHeaders = event.headers || {};
    const queryParams = event.queryStringParameters || {};

    const providedApiKey = incomingHeaders['x-api-key'] || incomingHeaders['X-Api-Key'] || queryParams['api_key'];

    // Verify API key against S3 keys or fallback to environment variable
    const isValid = await verifyApiKey(providedApiKey);
    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid API key required in x-api-key header or api_key query parameter'
        })
      };
    }

    const { rawPath, rawQueryString, queryStringParameters, body } = event;
    const httpMethod = event.requestContext.http.method;

    // Extract API name from path: /{apiName}/{path}
    const pathParts = rawPath.split('/').filter(Boolean);

    if (pathParts.length < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid path. Use format: /{apiName}/{path}',
          availableApis: Object.keys(parseApiMappings())
        })
      };
    }

    const apiName = pathParts[0];

    // Handle dummy path - return JSON from S3 instead of calling API
    if (apiName === 'dummy') {
      // Extract the S3 key from the path: /dummy/{s3-key-path}
      // Or use query parameter 's3_key' if provided
      const s3Key = 'dummy/' + (queryStringParameters?.s3_key || pathParts.slice(1).join('/'));

      if (!s3Key) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Dummy requires key path'
          })
        };
      }

      try {
        const jsonData = await loadJsonFromS3(s3Key);
        return {
          statusCode: 200,
          body: JSON.stringify(jsonData)
        };
      } catch (error) {
        console.error('Error loading dummy data from S3:', error);
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: 'Dummy data not found',
            message: s3Key
          })
        };
      }
    }

    const apiMappings = parseApiMappings();
    const apiHost = apiMappings[apiName];

    if (!apiHost) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unknown API: ${apiName}`,
          availableApis: Object.keys(apiMappings)
        })
      };
    }

    // Prepare request headers based on API type
    const requestHeaders = {
      'User-Agent': 'Ignite-Market-Proxy/1.0'
    };

    if (apiHost.includes('rapidapi.com')) {
      const rapidApiKey = process.env.RAPID_API_KEY;
      if (!rapidApiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'RAPID_API_KEY not configured in environment' })
        };
      }
      requestHeaders['x-rapidapi-host'] = apiHost;
      requestHeaders['x-rapidapi-key'] = rapidApiKey;
    } else if (apiHost.includes('pandascore.co')) {
      const pandascoreKey = process.env.PANDASCORE_API_KEY;
      if (!pandascoreKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'PANDASCORE_API_KEY not configured in environment' })
        };
      }
      requestHeaders['Authorization'] = `Bearer ${pandascoreKey}`;
    }

    // Build target URL
    const targetUrl = buildTargetUrl(apiHost, rawPath, queryStringParameters);
    if (!targetUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid URL path'
        })
      };
    }

    // For GET requests, use MySQL locking for cross-instance deduplication
    if (httpMethod === 'GET') {
      // Extract base URL without query params to avoid duplication
      // targetUrl.toString() already includes query params, so we extract the base URL
      const baseUrl = `${targetUrl.protocol}//${targetUrl.host}${targetUrl.pathname}`;
      const cacheKey = generateCacheKey(httpMethod, baseUrl, queryStringParameters);

      // Check local cache first
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log(`Returning cached response for: ${targetUrl.toString()}`);
        return cachedResponse;
      }

      // Also check MySQL cache (shared across instances)
      const mysqlCached = await getResultFromMysql(cacheKey);
      if (mysqlCached) {
        // Cache locally for faster access
        setCachedResponse(cacheKey, mysqlCached);
        console.log(`Returning MySQL cached response for: ${targetUrl.toString()}`);
        return mysqlCached;
      }

      // Try to acquire cache lock using INSERT (row-level locking)
      const lockResult = await acquireCacheLock(cacheKey);

      if (lockResult === null) {
        // MySQL not configured, proceed without cross-instance deduplication
        console.log(`[MYSQL] MySQL not configured, proceeding without lock for: ${targetUrl.toString()}`);
      } else if (!lockResult.acquired) {
        // Another request is handling this, wait for it to complete
        // Use local deduplication - only one poller per Lambda instance
        console.log(`[MYSQL] Waiting for in-flight request: ${targetUrl.toString()}`);
        try {
          const responseData = await waitForInFlightRequestLocal(cacheKey);
          return responseData;
        } catch (error) {
          console.error(`[MYSQL] Error waiting for in-flight request:`, error);
          // Fall through to make the request ourselves
        }
      }
      // If lock acquired, we're the first - proceed to make the request

      console.log(`Making request to: ${targetUrl.toString()}`);
      console.log('Request headers:', JSON.stringify(requestHeaders, null, 2));

      try {
        // Make the request
        const response = await makeRequest(targetUrl.toString(), httpMethod, requestHeaders, body);

        console.log(`Response status: ${response.status}`);

        const responseData = {
          statusCode: response.status,
          body: response.data
        };

        // Cache successful GET responses (both local and MySQL)
        if (response.status >= 200 && response.status < 300) {
          setCachedResponse(cacheKey, responseData); // Local cache
          // Store in MySQL (updates status from IN_FLIGHT to COMPLETED)
          if (lockResult?.acquired && lockResult?.lockToken) {
            await storeResultInMysql(cacheKey, responseData, lockResult.lockToken, CACHE_TTL); // MySQL cache (shared)
          }
          console.log(`Cached response for: ${targetUrl.toString()}`);
        } else {
          // If request failed, clean up the in-flight entry
          if (lockResult?.acquired && lockResult?.lockToken) {
            await cleanupInFlightEntry(cacheKey, lockResult.lockToken);
          }
        }

        return responseData;
      } catch (error) {
        // If request failed, clean up the in-flight entry
        if (lockResult?.acquired && lockResult?.lockToken) {
          await cleanupInFlightEntry(cacheKey, lockResult.lockToken);
        }
        throw error;
      }
    }

    // For non-GET requests, execute immediately (no caching or deduplication)

    // Add content-type if body is present
    if (body && ['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    console.log(`Making request to: ${targetUrl.toString()}`);
    console.log('Request headers:', JSON.stringify(requestHeaders, null, 2));

    // Make the request
    const response = await makeRequest(targetUrl.toString(), httpMethod, requestHeaders, body);

    console.log(`Response status: ${response.status}`);

    return {
      statusCode: response.status,
      body: response.data
    };
  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
