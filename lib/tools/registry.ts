/**
 * Tool Registry
 * Central registry for all available tools and their execution functions
 */

import { type ToolManifest } from '@/db/schema';

// Import all tool manifests and executors
import {
  webSearchManifest,
  executeWebSearch,
  type WebSearchInput
} from './web-search';

import {
  codeExecutionManifest,
  executeCode,
  type CodeExecutionInput
} from './code-execution';

import {
  fileOperationsManifest,
  executeFileOperation,
  type FileOperationInput
} from './file-operations';

import {
  apiIntegrationManifest,
  executeAPIRequest,
  type APIIntegrationInput
} from './api-integration';

import {
  browserAutomationManifest,
  executeBrowserAutomation,
  type BrowserAutomationInput
} from './browser-automation';

import {
  codeGenerationManifest,
  executeCodeGeneration,
  type CodeGenerationRequest
} from './code-generation';

import { buildToolManifest } from './build';

/**
 * Tool executor function type
 */
export type ToolExecutor<TInput = any, TOutput = any> = (
  input: TInput
) => Promise<TOutput>;

/**
 * Tool registration entry
 */
export interface ToolRegistration {
  manifest: ToolManifest;
  executor: ToolExecutor;
}

/**
 * Central tool registry
 */
export const toolRegistry: Map<string, ToolRegistration> = new Map([
  // Web Search Tool
  ['web_search', {
    manifest: webSearchManifest,
    executor: executeWebSearch as ToolExecutor<WebSearchInput>
  }],

  // Code Execution Tool
  ['code_execution', {
    manifest: codeExecutionManifest,
    executor: executeCode as ToolExecutor<CodeExecutionInput>
  }],

  // File Operations Tool
  ['file_operations', {
    manifest: fileOperationsManifest,
    executor: executeFileOperation as ToolExecutor<FileOperationInput>
  }],

  // API Integration Tool
  ['api_integration', {
    manifest: apiIntegrationManifest,
    executor: executeAPIRequest as ToolExecutor<APIIntegrationInput>
  }],

  // Browser Automation Tool
  ['browser_automation', {
    manifest: browserAutomationManifest,
    executor: executeBrowserAutomation as ToolExecutor<BrowserAutomationInput>
  }],

  // Code Generation Tool
  ['code_generation', {
    manifest: codeGenerationManifest,
    executor: executeCodeGeneration as ToolExecutor<CodeGenerationRequest>
  }],

  // Build Tool
  ['build_tool', {
    manifest: buildToolManifest,
    executor: async (input: any) => {
      // Build tool execution is handled separately
      throw new Error('Build tool must be executed through the build service');
    }
  }]
]);

/**
 * Get a tool by its key
 */
export function getTool(key: string): ToolRegistration | undefined {
  return toolRegistry.get(key);
}

/**
 * Get all tool manifests
 */
export function getAllToolManifests(): ToolManifest[] {
  return Array.from(toolRegistry.values()).map(reg => reg.manifest);
}

/**
 * Get all tool keys
 */
export function getAllToolKeys(): string[] {
  return Array.from(toolRegistry.keys());
}

/**
 * Execute a tool by key
 */
export async function executeTool<TInput = any, TOutput = any>(
  key: string,
  input: TInput
): Promise<TOutput> {
  const tool = getTool(key);
  
  if (!tool) {
    throw new Error(`Tool not found: ${key}`);
  }

  console.log(`[Tool Registry] Executing tool: ${key}`);
  
  try {
    const result = await tool.executor(input);
    console.log(`[Tool Registry] Tool ${key} completed successfully`);
    return result;
  } catch (error: any) {
    console.error(`[Tool Registry] Tool ${key} failed:`, error.message);
    throw error;
  }
}

/**
 * Check if a tool exists
 */
export function hasTool(key: string): boolean {
  return toolRegistry.has(key);
}

/**
 * Get tool manifest by key
 */
export function getToolManifest(key: string): ToolManifest | undefined {
  const tool = getTool(key);
  return tool?.manifest;
}
