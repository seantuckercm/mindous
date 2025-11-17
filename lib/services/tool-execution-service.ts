import { db } from '@/db';
import {
  toolRunsTable,
  toolRunEventsTable,
  type InsertToolRun,
  type SelectToolRun,
  type InsertToolRunEvent,
  type ToolManifest
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ToolRegistry } from './tool-registry';
import {
  executeWebSearch,
  executeCalculator,
  executeDataProcessor,
  executeApiCaller
} from '@/lib/tools';

/**
 * Tool Execution Service
 * Handles tool selection, execution, error handling, and event tracking
 */
export class ToolExecutionService {
  /**
   * Invoke a tool and create a tool run
   */
  static async invokeTool(params: {
    workspaceId: string;
    executionId: string;
    toolKey: string;
    input: any;
    requestedByUserId?: string;
  }): Promise<SelectToolRun> {
    const { workspaceId, executionId, toolKey, input, requestedByUserId } = params;

    // Get the tool
    const tool = await ToolRegistry.getToolByKey(workspaceId, toolKey);
    if (!tool || !tool.active) {
      throw new Error(`Tool not found or inactive: ${toolKey}`);
    }

    const manifest = tool.manifest as ToolManifest;

    // Validate input
    const validation = ToolRegistry.validateInput(manifest, input);
    if (!validation.valid) {
      throw new Error(`Invalid tool input: ${validation.errors}`);
    }

    // Create tool run record
    const [toolRun] = await db.insert(toolRunsTable).values({
      workspaceId,
      executionId,
      toolId: tool.id,
      requestedByUserId,
      status: 'queued',
      inputPayload: input,
    }).returning();

    // Log the tool run start
    await this.logEvent({
      toolRunId: toolRun.id,
      workspaceId,
      level: 'info',
      message: `Tool run queued: ${toolKey}`,
      data: { toolKey, input }
    });

    // Execute the tool (async)
    this.executeTool(toolRun.id, tool.id, manifest, input).catch(error => {
      console.error(`Tool execution failed for run ${toolRun.id}:`, error);
    });

    return toolRun;
  }

  /**
   * Execute a tool (background processing)
   */
  private static async executeTool(
    toolRunId: string,
    toolId: string,
    manifest: ToolManifest,
    input: any
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Update status to running
      await db
        .update(toolRunsTable)
        .set({
          status: 'running',
          startedAt: new Date()
        })
        .where(eq(toolRunsTable.id, toolRunId));

      // Get the tool run to access workspace ID
      const [toolRun] = await db
        .select()
        .from(toolRunsTable)
        .where(eq(toolRunsTable.id, toolRunId));

      if (!toolRun) {
        throw new Error('Tool run not found');
      }

      await this.logEvent({
        toolRunId,
        workspaceId: toolRun.workspaceId,
        level: 'info',
        message: `Executing tool: ${manifest.key}`,
        data: { toolKey: manifest.key }
      });

      // Execute the tool based on its key
      let output: any;
      
      try {
        output = await this.executeToolByKey(manifest.key, input, manifest.resources.timeoutSec);
      } catch (execError: any) {
        throw new Error(`Tool execution error: ${execError.message}`);
      }

      // Validate output
      const validation = ToolRegistry.validateOutput(manifest, output);
      if (!validation.valid) {
        throw new Error(`Invalid tool output: ${validation.errors}`);
      }

      // Calculate execution time
      const executionTime = (Date.now() - startTime) / 1000;

      // Update tool run with success
      await db
        .update(toolRunsTable)
        .set({
          status: 'succeeded',
          outputPayload: output,
          finishedAt: new Date(),
          exitCode: 0,
          cpuSeconds: executionTime.toString()
        })
        .where(eq(toolRunsTable.id, toolRunId));

      await this.logEvent({
        toolRunId,
        workspaceId: toolRun.workspaceId,
        level: 'info',
        message: `Tool execution succeeded`,
        data: {
          executionTime,
          output
        }
      });

    } catch (error: any) {
      // Get the tool run to access workspace ID
      const [toolRun] = await db
        .select()
        .from(toolRunsTable)
        .where(eq(toolRunsTable.id, toolRunId));

      if (toolRun) {
        // Update tool run with failure
        await db
          .update(toolRunsTable)
          .set({
            status: 'failed',
            error: error.message,
            finishedAt: new Date(),
            exitCode: 1
          })
          .where(eq(toolRunsTable.id, toolRunId));

        await this.logEvent({
          toolRunId,
          workspaceId: toolRun.workspaceId,
          level: 'error',
          message: `Tool execution failed: ${error.message}`,
          data: { error: error.message }
        });
      }
    }
  }

  /**
   * Execute tool by key (mock implementations for development)
   */
  private static async executeToolByKey(
    toolKey: string,
    input: any,
    timeoutSec: number
  ): Promise<any> {
    // Set timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tool execution timeout')), timeoutSec * 1000);
    });

    // Execute based on tool key
    let executionPromise: Promise<any>;

    switch (toolKey) {
      case 'web_search':
        executionPromise = executeWebSearch(input);
        break;
      case 'calculator':
        executionPromise = executeCalculator(input);
        break;
      case 'data_processor':
        executionPromise = executeDataProcessor(input);
        break;
      case 'api_caller':
        executionPromise = executeApiCaller(input);
        break;
      default:
        throw new Error(`Unknown tool: ${toolKey}`);
    }

    // Race between execution and timeout
    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Get tool run by ID
   */
  static async getToolRun(toolRunId: string): Promise<SelectToolRun | null> {
    const [toolRun] = await db
      .select()
      .from(toolRunsTable)
      .where(eq(toolRunsTable.id, toolRunId));

    return toolRun || null;
  }

  /**
   * Get tool runs for an execution
   */
  static async getToolRunsForExecution(executionId: string): Promise<SelectToolRun[]> {
    return db
      .select()
      .from(toolRunsTable)
      .where(eq(toolRunsTable.executionId, executionId))
      .orderBy(toolRunsTable.createdAt);
  }

  /**
   * Get tool run events (logs)
   */
  static async getToolRunEvents(toolRunId: string) {
    return db
      .select()
      .from(toolRunEventsTable)
      .where(eq(toolRunEventsTable.toolRunId, toolRunId))
      .orderBy(toolRunEventsTable.ts);
  }

  /**
   * Log an event for a tool run
   */
  static async logEvent(params: {
    toolRunId: string;
    workspaceId: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
  }): Promise<void> {
    await db.insert(toolRunEventsTable).values({
      toolRunId: params.toolRunId,
      workspaceId: params.workspaceId,
      level: params.level,
      message: params.message,
      data: params.data
    });
  }

  /**
   * Cancel a tool run
   */
  static async cancelToolRun(toolRunId: string): Promise<void> {
    const [toolRun] = await db
      .select()
      .from(toolRunsTable)
      .where(eq(toolRunsTable.id, toolRunId));

    if (!toolRun) {
      throw new Error('Tool run not found');
    }

    if (toolRun.status === 'succeeded' || toolRun.status === 'failed' || toolRun.status === 'canceled') {
      throw new Error('Cannot cancel a completed tool run');
    }

    await db
      .update(toolRunsTable)
      .set({
        status: 'canceled',
        finishedAt: new Date()
      })
      .where(eq(toolRunsTable.id, toolRunId));

    await this.logEvent({
      toolRunId,
      workspaceId: toolRun.workspaceId,
      level: 'warn',
      message: 'Tool run canceled',
      data: {}
    });
  }

  /**
   * Select appropriate tool based on task requirements
   */
  static async selectToolForTask(
    workspaceId: string,
    taskDescription: string
  ): Promise<string[]> {
    // Simple keyword-based tool selection
    const keywords = taskDescription.toLowerCase();
    const selectedTools: string[] = [];

    if (keywords.includes('search') || keywords.includes('find') || keywords.includes('lookup')) {
      selectedTools.push('web_search');
    }

    if (keywords.includes('calculate') || keywords.includes('compute') || keywords.includes('math')) {
      selectedTools.push('calculator');
    }

    if (keywords.includes('data') || keywords.includes('process') || keywords.includes('analyze')) {
      selectedTools.push('data_processor');
    }

    if (keywords.includes('api') || keywords.includes('request') || keywords.includes('fetch')) {
      selectedTools.push('api_caller');
    }

    return selectedTools;
  }
}
