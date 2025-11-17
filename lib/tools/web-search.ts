
import { type ToolManifest } from '@/db/schema';

/**
 * Web Search Tool
 * Searches the web and returns top results
 */
export const webSearchManifest: ToolManifest = {
  key: 'web_search',
  version: '1.0.0',
  description: 'Search the web and return top results with titles, URLs, and snippets',
  inputSchema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        minLength: 2,
        description: 'The search query'
      },
      max_results: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        default: 5,
        description: 'Maximum number of results to return'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            snippet: { type: 'string' }
          },
          required: ['title', 'url']
        }
      }
    },
    required: ['results']
  },
  resources: {
    timeoutSec: 45,
    memMb: 512,
    cpuShares: 256
  },
  container: {
    image: 'mindous/tool-web-search:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json'],
    envVars: ['TAVILY_API_KEY']
  },
  permissions: {
    network: {
      enabled: true,
      allowedDomains: ['api.tavily.com', 'serpapi.com']
    },
    filesystem: {
      tempDirMb: 256
    }
  }
};

/**
 * Mock web search implementation for development
 */
export async function executeWebSearch(input: { query: string; max_results?: number }) {
  // This is a mock implementation for development
  // In production, this would be replaced with actual API calls
  const results = Array.from({ length: input.max_results || 5 }, (_, i) => ({
    title: `Result ${i + 1} for "${input.query}"`,
    url: `https://example.com/result-${i + 1}`,
    snippet: `This is a sample snippet for search result ${i + 1} about ${input.query}`
  }));

  return { results };
}
