import https from 'https';
import { URL } from 'url';

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
    const requiredApiKey = process.env.API_PROXY_KEY;
    if (requiredApiKey) {
      const incomingHeaders = event.headers || {};
      const providedApiKey = incomingHeaders['x-api-key']

      if (!providedApiKey || providedApiKey !== requiredApiKey) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Valid API key required in x-api-key header'
          })
        };
      }
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
