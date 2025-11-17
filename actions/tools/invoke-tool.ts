
'use server';

import { auth } from '@clerk/nextjs/server';
import { ToolExecutionService } from '@/lib/services/tool-execution-service';

/**
 * Invoke a tool
 */
export async function invokeTool(params: {
  workspaceId: string;
  executionId: string;
  toolKey: string;
  input: any;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user belongs to workspace and execution
  
  try {
    const toolRun = await ToolExecutionService.invokeTool({
      workspaceId: params.workspaceId,
      executionId: params.executionId,
      toolKey: params.toolKey,
      input: params.input,
      requestedByUserId: userId
    });
    
    return { success: true, toolRun };
  } catch (error: any) {
    console.error('Failed to invoke tool:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get tool run by ID
 */
export async function getToolRun(toolRunId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user has access to this tool run
  
  try {
    const toolRun = await ToolExecutionService.getToolRun(toolRunId);
    
    if (!toolRun) {
      return { success: false, error: 'Tool run not found' };
    }
    
    const events = await ToolExecutionService.getToolRunEvents(toolRunId);
    
    return {
      success: true,
      toolRun,
      events
    };
  } catch (error: any) {
    console.error('Failed to get tool run:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get tool runs for an execution
 */
export async function getToolRunsForExecution(executionId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user has access to this execution
  
  try {
    const toolRuns = await ToolExecutionService.getToolRunsForExecution(executionId);
    return { success: true, toolRuns };
  } catch (error: any) {
    console.error('Failed to get tool runs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a tool run
 */
export async function cancelToolRun(toolRunId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Verify user has access to this tool run
  
  try {
    await ToolExecutionService.cancelToolRun(toolRunId);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to cancel tool run:', error);
    return { success: false, error: error.message };
  }
}
