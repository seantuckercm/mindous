
import { type ToolManifest } from '@/db/schema';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Integration Tool
 * Makes HTTP requests to external APIs with authentication and retry support
 */
export const apiIntegrationManifest: ToolManifest = {
  key: 'api_integration',
  version: '1.0.0',
  description: 'Make HTTP requests to external APIs with support for various authentication methods, retries, and timeouts',
  inputSchema: {
    type: 'object',
    required: ['url', 'method'],
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'The API endpoint URL'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
        description: 'HTTP method'
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'HTTP headers'
      },
      body: {
        type: 'object',
        description: 'Request body (for POST, PUT, PATCH)'
      },
      params: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'URL query parameters'
      },
      auth: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['bearer', 'api_key', 'basic'],
            description: 'Authentication type'
          },
          token: {
            type: 'string',
            description: 'Bearer token or API key'
          },
          username: {
            type: 'string',
            description: 'Username (for basic auth)'
          },
          password: {
            type: 'string',
            description: 'Password (for basic auth)'
          },
          apiKeyHeader: {
            type: 'string',
            default: 'X-API-Key',
            description: 'Header name for API key'
          }
        }
      },
      timeout: {
        type: 'integer',
        minimum: 1000,
        maximum: 60000,
        default: 30000,
        description: 'Request timeout in milliseconds'
      },
      retries: {
        type: 'integer',
        minimum: 0,
        maximum: 5,
        default: 0,
        description: 'Number of retry attempts on failure'
      },
      responseType: {
        type: 'string',
        enum: ['json', 'text', 'blob', 'arraybuffer'],
        default: 'json',
        description: 'Expected response type'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the request succeeded'
      },
      status: {
        type: 'integer',
        description: 'HTTP status code'
      },
      statusText: {
        type: 'string',
        description: 'HTTP status text'
      },
      headers: {
        type: 'object',
        description: 'Response headers'
      },
      data: {
        description: 'Response data'
      },
      error: {
        type: 'string',
        description: 'Error message if request failed'
      },
      duration: {
        type: 'integer',
        description: 'Request duration in milliseconds'
      }
    },
    required: ['success', 'status']
  },
  resources: {
    timeoutSec: 60,
    memMb: 512,
    cpuShares: 256
  },
  container: {
    image: 'mindous/tool-api-integration:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: true
    },
    filesystem: {
      tempDirMb: 256
    }
  }
};

export interface APIAuth {
  type: 'bearer' | 'api_key' | 'basic';
  token?: string;
  username?: string;
  password?: string;
  apiKeyHeader?: string;
}

export interface APIIntegrationInput {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  auth?: APIAuth;
  timeout?: number;
  retries?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

export interface APIIntegrationOutput {
  success: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data?: any;
  error?: string;
  duration: number;
}

/**
 * Execute API integration tool
 */
export async function executeAPIRequest(input: APIIntegrationInput): Promise<APIIntegrationOutput> {
  const {
    url,
    method,
    headers = {},
    body,
    params,
    auth,
    timeout = 30000,
    retries = 0,
    responseType = 'json'
  } = input;

  const startTime = Date.now();
  let lastError: any;

  // Prepare request config
  const config: AxiosRequestConfig = {
    url,
    method,
    headers: { ...headers },
    params,
    timeout,
    responseType: responseType as any,
    validateStatus: () => true // Don't throw on any status code
  };

  // Add request body for appropriate methods
  if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
    config.data = body;
    
    // Set content-type if not already set
    if (!config.headers!['Content-Type'] && !config.headers!['content-type']) {
      config.headers!['Content-Type'] = 'application/json';
    }
  }

  // Add authentication
  if (auth) {
    applyAuthentication(config, auth);
  }

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[API Integration] Request attempt ${attempt + 1}:`, method, url);
      
      const response: AxiosResponse = await axios(config);
      const duration = Date.now() - startTime;

      const success = response.status >= 200 && response.status < 300;

      return {
        success,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        duration,
        error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error: any) {
      lastError = error;
      console.error(`[API Integration] Request attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const duration = Date.now() - startTime;
  
  return {
    success: false,
    status: lastError.response?.status || 0,
    statusText: lastError.response?.statusText || 'Request Failed',
    headers: lastError.response?.headers || {},
    error: formatError(lastError),
    duration
  };
}

/**
 * Apply authentication to request config
 */
function applyAuthentication(config: AxiosRequestConfig, auth: APIAuth): void {
  switch (auth.type) {
    case 'bearer':
      if (auth.token) {
        config.headers!['Authorization'] = `Bearer ${auth.token}`;
      }
      break;

    case 'api_key':
      if (auth.token) {
        const headerName = auth.apiKeyHeader || 'X-API-Key';
        config.headers![headerName] = auth.token;
      }
      break;

    case 'basic':
      if (auth.username && auth.password) {
        const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        config.headers!['Authorization'] = `Basic ${encoded}`;
      }
      break;
  }
}

/**
 * Format error message
 */
function formatError(error: any): string {
  if (error.response) {
    // Server responded with error status
    return `HTTP ${error.response.status}: ${error.response.statusText || 'Unknown error'}`;
  } else if (error.request) {
    // Request was made but no response received
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused - server not reachable';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return 'Request timeout';
    } else {
      return `Network error: ${error.message}`;
    }
  } else {
    // Something else happened
    return error.message || 'Unknown error';
  }
}

/**
 * Helper function to make a simple GET request
 */
export async function simpleGet(url: string, headers?: Record<string, string>): Promise<any> {
  const result = await executeAPIRequest({
    url,
    method: 'GET',
    headers
  });

  if (!result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}

/**
 * Helper function to make a simple POST request
 */
export async function simplePost(
  url: string,
  body: any,
  headers?: Record<string, string>
): Promise<any> {
  const result = await executeAPIRequest({
    url,
    method: 'POST',
    body,
    headers
  });

  if (!result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}
