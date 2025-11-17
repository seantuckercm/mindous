
import { type ToolManifest } from '@/db/schema';
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';

// Cache search results for 1 hour
const searchCache = new NodeCache({ stdTTL: 3600 });

/**
 * Web Search Tool
 * Searches the web and returns top results using Tavily API
 */
export const webSearchManifest: ToolManifest = {
  key: 'web_search',
  version: '2.0.0',
  description: 'Search the web and return top results with titles, URLs, and snippets. Supports general search, news, and images.',
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
      },
      search_type: {
        type: 'string',
        enum: ['general', 'news', 'images'],
        default: 'general',
        description: 'Type of search to perform'
      },
      include_domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Domains to include in search results'
      },
      exclude_domains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Domains to exclude from search results'
      },
      time_range: {
        type: 'string',
        enum: ['day', 'week', 'month', 'year'],
        description: 'Time range for news search'
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
            snippet: { type: 'string' },
            content: { type: 'string' },
            score: { type: 'number' },
            published_date: { type: 'string' }
          },
          required: ['title', 'url']
        }
      },
      query: { type: 'string' },
      cached: { type: 'boolean' }
    },
    required: ['results', 'query']
  },
  resources: {
    timeoutSec: 45,
    memMb: 512,
    cpuShares: 256
  },
  container: {
    image: 'mindous/tool-web-search:2.0.0',
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

export interface WebSearchInput {
  query: string;
  max_results?: number;
  search_type?: 'general' | 'news' | 'images';
  include_domains?: string[];
  exclude_domains?: string[];
  time_range?: 'day' | 'week' | 'month' | 'year';
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet?: string;
  content?: string;
  score?: number;
  published_date?: string;
}

export interface WebSearchOutput {
  results: WebSearchResult[];
  query: string;
  cached: boolean;
}

/**
 * Execute web search using Tavily API
 */
export async function executeWebSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  const {
    query,
    max_results = 5,
    search_type = 'general',
    include_domains,
    exclude_domains,
    time_range
  } = input;

  // Check cache first
  const cacheKey = JSON.stringify(input);
  const cached = searchCache.get<WebSearchOutput>(cacheKey);
  if (cached) {
    console.log('[Web Search] Returning cached results for:', query);
    return { ...cached, cached: true };
  }

  try {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      console.warn('[Web Search] TAVILY_API_KEY not found, using mock results');
      return mockWebSearch(input);
    }

    const tvly = tavily({ apiKey });

    // Build search options
    const searchOptions: any = {
      maxResults: max_results,
      searchDepth: 'advanced',
      includeAnswer: true,
      includeRawContent: false
    };

    if (include_domains && include_domains.length > 0) {
      searchOptions.includeDomains = include_domains;
    }

    if (exclude_domains && exclude_domains.length > 0) {
      searchOptions.excludeDomains = exclude_domains;
    }

    // For news searches, add time filter
    if (search_type === 'news' && time_range) {
      searchOptions.days = timeRangeToDays(time_range);
    }

    console.log('[Web Search] Searching with Tavily:', query, searchOptions);

    const response = await tvly.search(query, searchOptions);

    const results: WebSearchResult[] = response.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      snippet: result.content || '',
      content: result.rawContent || result.content || '',
      score: result.score || 0,
      published_date: result.publishedDate
    }));

    const output: WebSearchOutput = {
      results,
      query,
      cached: false
    };

    // Cache the results
    searchCache.set(cacheKey, output);

    return output;

  } catch (error: any) {
    console.error('[Web Search] Error:', error.message);
    
    // Rate limit handling
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Fallback to mock for development
    console.warn('[Web Search] Falling back to mock results');
    return mockWebSearch(input);
  }
}

/**
 * Convert time range to days
 */
function timeRangeToDays(timeRange: string): number {
  const ranges: Record<string, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365
  };
  return ranges[timeRange] || 30;
}

/**
 * Mock web search implementation for development/fallback
 */
function mockWebSearch(input: WebSearchInput): WebSearchOutput {
  const { query, max_results = 5 } = input;
  
  const results: WebSearchResult[] = Array.from({ length: max_results }, (_, i) => ({
    title: `Result ${i + 1} for "${query}"`,
    url: `https://example.com/result-${i + 1}`,
    snippet: `This is a sample snippet for search result ${i + 1} about ${query}. In a production environment, this would contain real search results from Tavily.`,
    score: 0.9 - (i * 0.1)
  }));

  return { results, query, cached: false };
}
