
'use server';

import { auth } from '@clerk/nextjs/server';
import { ToolRegistry } from '@/lib/services/tool-registry';

/**
 * List all active tools for a workspace
 */
export async function listTools(workspaceId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user belongs to workspace
  
  try {
    const tools = await ToolRegistry.getActiveTools(workspaceId);
    return { success: true, tools };
  } catch (error: any) {
    console.error('Failed to list tools:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get tool by key
 */
export async function getToolByKey(workspaceId: string, toolKey: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user belongs to workspace
  
  try {
    const tool = await ToolRegistry.getToolByKey(workspaceId, toolKey);
    
    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }
    
    return { success: true, tool };
  } catch (error: any) {
    console.error('Failed to get tool:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get LLM function specs for all active tools
 */
export async function getLLMFunctionSpecs(workspaceId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user belongs to workspace
  
  try {
    const specs = await ToolRegistry.getLLMFunctionSpecs(workspaceId);
    return { success: true, specs };
  } catch (error: any) {
    console.error('Failed to get LLM function specs:', error);
    return { success: false, error: error.message };
  }
}
