import https from 'node:https';
import { URL } from 'node:url';
import crypto from 'node:crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as consumers from 'node:stream/consumers';

// Cache TTL in seconds (default: 30 seconds)
const CACHE_TTL = parseInt(process.env.API_PROXY_CACHE_TTL) || 30;

// Maximum number of cache entries (default: 50)
// Prevents memory exhaustion with many unique requests
const MAX_CACHE_ENTRIES = parseInt(process.env.API_PROXY_MAX_CACHE_ENTRIES) || 50;

// Maximum response size to cache in bytes (default: 2MB)
// Prevents caching extremely large responses that could cause memory issues
const MAX_CACHE_RESPONSE_SIZE = parseInt(process.env.API_PROXY_MAX_CACHE_SIZE) || 2 * 1024 * 1024;

// Maximum total cache memory in bytes (default: 30MB)
// Conservative limit to leave room for Lambda runtime (~30-50MB), code (~10-20MB), and request handling
// Set to ~25% of 128MB Lambda memory to be safe
const MAX_TOTAL_CACHE_MEMORY = parseInt(process.env.API_PROXY_MAX_TOTAL_CACHE_MEMORY) || 30 * 1024 * 1024;

// Simple in-memory cache with TTL and LRU eviction (using only built-in Node.js modules)
const cache = new Map();
// Track access order for LRU eviction
const accessOrder = [];
// Track total estimated memory usage
let totalCacheMemory = 0;
// Counter for periodic cleanup (cleanup every N operations to avoid performance impact)
let operationCount = 0;
const CLEANUP_FREQUENCY = 10; // Clean up every 10 cache operations

// Track in-flight requests to deduplicate concurrent requests
// Maps cache key to a promise that resolves when the request completes
const inFlightRequests = new Map();

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

// Get cached response if available and not expired
const getCachedResponse = (key) => {
  // Periodic cleanup (Lambda-friendly, no background intervals)
  operationCount++;
  if (operationCount % CLEANUP_FREQUENCY === 0) {
    cleanupExpiredEntries();
  }

  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (now > cached.expiresAt) {
    // Remove from memory tracking
    const entrySize = estimateResponseSize(cached.data);
    totalCacheMemory -= entrySize;

    cache.delete(key);
    // Remove from access order
    const index = accessOrder.indexOf(key);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
    return null;
  }

  // Update access order for LRU (move to end)
  const index = accessOrder.indexOf(key);
  if (index > -1) {
    accessOrder.splice(index, 1);
  }
  accessOrder.push(key);

  return cached.data;
};

// Estimate response size in bytes (rough approximation)
const estimateResponseSize = (responseData) => {
  try {
    return JSON.stringify(responseData).length;
  } catch {
    // Fallback: estimate based on body length
    return (responseData.body || '').length;
  }
};

// Store response in cache with size limits and LRU eviction
const setCachedResponse = (key, data) => {
  // Check if response is too large to cache
  const estimatedSize = estimateResponseSize(data);
  if (estimatedSize > MAX_CACHE_RESPONSE_SIZE) {
    console.log(`Skipping cache for large response: ${estimatedSize} bytes (max: ${MAX_CACHE_RESPONSE_SIZE})`);
    return;
  }

  // Evict oldest entries until we have room (by count or memory)
  while (cache.size >= MAX_CACHE_ENTRIES || (totalCacheMemory + estimatedSize > MAX_TOTAL_CACHE_MEMORY && cache.size > 0)) {
    // Remove oldest entry (first in access order)
    const oldestKey = accessOrder.shift();
    if (oldestKey) {
      const oldestEntry = cache.get(oldestKey);
      if (oldestEntry) {
        const oldestSize = estimateResponseSize(oldestEntry.data);
        totalCacheMemory -= oldestSize;
      }
      cache.delete(oldestKey);
      console.log(`Evicted oldest cache entry (entries: ${cache.size}, memory: ${Math.round(totalCacheMemory / 1024 / 1024)}MB)`);
    } else {
      break; // No more entries to evict
    }
  }

  // Check if we still don't have enough room after eviction
  if (totalCacheMemory + estimatedSize > MAX_TOTAL_CACHE_MEMORY) {
    console.log(
      `Skipping cache: would exceed memory limit (current: ${Math.round(totalCacheMemory / 1024 / 1024)}MB, adding: ${Math.round(estimatedSize / 1024 / 1024)}MB, max: ${Math.round(MAX_TOTAL_CACHE_MEMORY / 1024 / 1024)}MB)`
    );
    return;
  }

  const expiresAt = Date.now() + CACHE_TTL * 1000;
  cache.set(key, { data, expiresAt });
  totalCacheMemory += estimatedSize;

  // Add to end of access order (most recently used)
  accessOrder.push(key);
};

// Clean expired cache entries on-demand (Lambda-friendly)
// This is called during cache operations to avoid background intervals
const cleanupExpiredEntries = () => {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, value] of cache.entries()) {
    if (now > value.expiresAt) {
      keysToDelete.push(key);
    }
  }

  // Remove expired entries from both cache and access order
  keysToDelete.forEach((key) => {
    const entry = cache.get(key);
    if (entry) {
      const entrySize = estimateResponseSize(entry.data);
      totalCacheMemory -= entrySize;
    }
    cache.delete(key);
    const index = accessOrder.indexOf(key);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
  });

  if (keysToDelete.length > 0) {
    console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
  }
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
            error: 'Dummy path requires key path'
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
            message: error.message,
            s3Key: s3Key
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

    // Get API key from environment
    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'API key not configured in environment'
        })
      };
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

    // Generate cache key for request deduplication
    const cacheKey = generateCacheKey(httpMethod, targetUrl.toString(), queryStringParameters);

    // For GET requests, check cache and handle deduplication atomically
    if (httpMethod === 'GET') {
      const cachedResponse = getCachedResponse(cacheKey);

      if (cachedResponse) {
        console.log(`Returning cached response for: ${targetUrl.toString()}`);
        return cachedResponse;
      }

      // Atomically get or create in-flight request promise
      // This ensures only the first request creates the promise, others wait for it
      // Use a double-check locking pattern to ensure atomicity
      let requestPromise = inFlightRequests.get(cacheKey);

      if (!requestPromise) {
        // Create promise factory - but don't execute yet
        // We'll only execute if we successfully set it first
        let promiseResolve, promiseReject;
        const deferredPromise = new Promise((resolve, reject) => {
          promiseResolve = resolve;
          promiseReject = reject;
        });

        // Try to set it atomically - if it already exists, another request beat us
        const existingPromise = inFlightRequests.get(cacheKey);
        if (existingPromise) {
          // Another request beat us, use theirs
          requestPromise = existingPromise;
          console.log(`Another request already started for: ${targetUrl.toString()}, waiting for it`);
        } else {
          // We're the first! Set our placeholder promise immediately
          inFlightRequests.set(cacheKey, deferredPromise);
          console.log(`Created new in-flight request for: ${targetUrl.toString()}`);

          // Now execute the actual request and resolve our deferred promise
          (async () => {
            try {
              // Prepare request headers
              const requestHeaders = {
                'x-rapidapi-host': apiHost,
                'x-rapidapi-key': apiKey,
                'User-Agent': 'Ignite-Market-Proxy/1.0'
              };

              console.log(`Making request to: ${targetUrl.toString()}`);
              console.log('Request headers:', JSON.stringify(requestHeaders, null, 2));

              // Make the request
              const response = await makeRequest(targetUrl.toString(), httpMethod, requestHeaders, body);

              console.log(`Response status: ${response.status}`);

              const responseData = {
                statusCode: response.status,
                body: response.data
              };

              // Cache successful GET responses
              if (response.status >= 200 && response.status < 300) {
                setCachedResponse(cacheKey, responseData);
                console.log(`Cached response for: ${targetUrl.toString()}`);
              }

              promiseResolve(responseData);
            } catch (error) {
              promiseReject(error);
            } finally {
              // Remove from in-flight requests when done (success or failure)
              inFlightRequests.delete(cacheKey);
            }
          })();

          requestPromise = deferredPromise;
        }
      } else {
        console.log(`Waiting for existing in-flight request for: ${targetUrl.toString()}`);
      }

      // Wait for the promise (either ours or another request's)
      try {
        return await requestPromise;
      } catch (error) {
        // If the in-flight request failed, remove it so future requests can retry
        if (inFlightRequests.get(cacheKey) === requestPromise) {
          inFlightRequests.delete(cacheKey);
        }
        throw error;
      }
    }

    // For non-GET requests, execute immediately (no caching or deduplication)
    // Prepare request headers
    const requestHeaders = {
      'x-rapidapi-host': apiHost,
      'x-rapidapi-key': apiKey,
      'User-Agent': 'Ignite-Market-Proxy/1.0'
    };

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
