
import { type ToolManifest } from '@/db/schema';

/**
 * API Caller Tool
 * Makes HTTP requests to external APIs with configurable methods and parameters
 */
export const apiCallerManifest: ToolManifest = {
  key: 'api_caller',
  version: '1.0.0',
  description: 'Make HTTP requests to external APIs with support for GET, POST, PUT, DELETE methods',
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
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        description: 'HTTP method'
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'HTTP headers to include in the request'
      },
      body: {
        type: 'object',
        description: 'Request body for POST/PUT/PATCH requests'
      },
      timeout: {
        type: 'integer',
        minimum: 1000,
        maximum: 30000,
        default: 10000,
        description: 'Request timeout in milliseconds'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'integer',
        description: 'HTTP status code'
      },
      headers: {
        type: 'object',
        description: 'Response headers'
      },
      data: {
        type: 'object',
        description: 'Response body'
      }
    },
    required: ['status', 'data']
  },
  resources: {
    timeoutSec: 60,
    memMb: 512,
    cpuShares: 256
  },
  container: {
    image: 'mindous/tool-api-caller:1.0.0',
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

/**
 * Mock API caller implementation for development
 */
export async function executeApiCaller(input: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}) {
  // This is a mock implementation for development
  // In production, this would make actual HTTP requests in a container
  try {
    return {
      status: 200,
      headers: {
        'content-type': 'application/json'
      },
      data: {
        message: 'Mock API response',
        request: {
          url: input.url,
          method: input.method
        }
      }
    };
  } catch (error) {
    throw new Error(`API call failed: ${error}`);
  }
}
