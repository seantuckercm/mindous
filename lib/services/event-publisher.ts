import { publishEvent, getRunChannel } from '@/lib/redis';
import { db } from '@/db';
import { runEventsTable } from '@/db/schema';

/**
 * Event Publisher Service
 * Publishes agent execution events to SSE streams via Redis
 */

export type AgentEventType =
  // Execution lifecycle
  | 'EXECUTION_STARTED'
  | 'EXECUTION_PROGRESS'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED'
  // Step events
  | 'STEP_STARTED'
  | 'STEP_PROGRESS'
  | 'STEP_COMPLETED'
  // Tool events
  | 'TOOL_CALLED'
  | 'TOOL_RESULT'
  // Code generation events
  | 'CODE_GENERATION_STARTED'
  | 'CODE_GENERATION_CHUNK'
  | 'CODE_GENERATION_COMPLETED'
  // Build events
  | 'BUILD_STARTED'
  | 'BUILD_LOG'
  | 'BUILD_PROGRESS'
  | 'BUILD_COMPLETED'
  | 'BUILD_FAILED'
  // Preview events
  | 'PREVIEW_STARTING'
  | 'PREVIEW_READY'
  | 'PREVIEW_FAILED';

export interface PublishEventParams {
  runId: string;
  subtaskId?: string;
  eventType: AgentEventType | string;
  message: string;
  data?: any;
  metadata?: Record<string, any>;
}

export class EventPublisher {
  /**
   * Publish an event to both Redis and database
   */
  static async publishEvent(params: PublishEventParams): Promise<void> {
    const { runId, subtaskId, eventType, message, data, metadata } = params;

    try {
      // Store in database for replay and history
      await db.insert(runEventsTable).values({
        runId,
        subtaskId: subtaskId || null,
        eventType: eventType as any,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
      });

      // Publish to Redis for real-time streaming
      const channel = getRunChannel(runId);
      await publishEvent(channel, {
        runId,
        subtaskId,
        eventType,
        message,
        data,
        metadata,
      });

      console.log(`📤 Event published: ${eventType} for run ${runId}`);
    } catch (error) {
      console.error('❌ Failed to publish event:', error);
      // Don't throw - event publishing should not break the main flow
    }
  }

  /**
   * Publish execution started event
   */
  static async publishExecutionStarted(
    runId: string,
    data: { executionId: string; prompt: string }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'EXECUTION_STARTED',
      message: 'Agent execution started',
      data,
    });
  }

  /**
   * Publish execution progress event
   */
  static async publishExecutionProgress(
    runId: string,
    data: { currentStep: string; stepIndex: number; totalSteps: number; progress: number }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'EXECUTION_PROGRESS',
      message: `Executing step ${data.stepIndex + 1}/${data.totalSteps}: ${data.currentStep}`,
      data,
    });
  }

  /**
   * Publish execution completed event
   */
  static async publishExecutionCompleted(
    runId: string,
    data: { executionId: string; result?: any }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'EXECUTION_COMPLETED',
      message: 'Agent execution completed successfully',
      data,
    });
  }

  /**
   * Publish execution failed event
   */
  static async publishExecutionFailed(
    runId: string,
    data: { executionId: string; error: string }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'EXECUTION_FAILED',
      message: 'Agent execution failed',
      data,
    });
  }

  /**
   * Publish code generation chunk event (for streaming)
   */
  static async publishCodeChunk(
    runId: string,
    subtaskId: string,
    chunk: string
  ): Promise<void> {
    await this.publishEvent({
      runId,
      subtaskId,
      eventType: 'CODE_GENERATION_CHUNK',
      message: 'Code chunk generated',
      data: { chunk },
    });
  }

  /**
   * Publish code generation completed event
   */
  static async publishCodeGenerationCompleted(
    runId: string,
    subtaskId: string,
    data: {
      generationId: string;
      language: string;
      framework?: string;
      filePath?: string;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      subtaskId,
      eventType: 'CODE_GENERATION_COMPLETED',
      message: `Code generation completed: ${data.filePath || 'untitled'}`,
      data,
    });
  }

  /**
   * Publish build event
   */
  static async publishBuildEvent(
    runId: string,
    buildId: string,
    eventType: AgentEventType,
    message: string,
    data?: any
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType,
      message,
      data: { buildId, ...data },
    });
  }

  /**
   * Publish build log event
   */
  static async publishBuildLog(
    runId: string,
    buildId: string,
    log: string
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'BUILD_LOG',
      message: log,
      data: { buildId, log },
    });
  }

  /**
   * Publish build progress event
   */
  static async publishBuildProgress(
    runId: string,
    data: {
      buildId: string;
      status: string;
      progress: number;
      stage: string;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'BUILD_PROGRESS',
      message: `Build ${data.stage}: ${data.progress}%`,
      data,
    });
  }

  /**
   * Publish build completed event
   */
  static async publishBuildCompleted(
    runId: string,
    data: {
      buildId: string;
      buildPath: string;
      outputPath: string;
      durationMs: number;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'BUILD_COMPLETED',
      message: 'Build completed successfully',
      data,
    });
  }

  /**
   * Publish build failed event
   */
  static async publishBuildFailed(
    runId: string,
    data: {
      buildId: string;
      error: string;
      logs?: string;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'BUILD_FAILED',
      message: 'Build failed',
      data,
    });
  }

  /**
   * Publish preview ready event
   */
  static async publishPreviewReady(
    runId: string,
    data: {
      previewId: string;
      url: string;
      port: number;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'PREVIEW_READY',
      message: 'Preview deployment ready',
      data,
    });
  }

  /**
   * Publish preview failed event
   */
  static async publishPreviewFailed(
    runId: string,
    data: {
      previewId?: string;
      error: string;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      eventType: 'PREVIEW_FAILED',
      message: 'Preview deployment failed',
      data,
    });
  }

  /**
   * Publish tool called event
   */
  static async publishToolCalled(
    runId: string,
    subtaskId: string,
    data: {
      toolName: string;
      toolInput: any;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      subtaskId,
      eventType: 'TOOL_CALLED',
      message: `Calling tool: ${data.toolName}`,
      data,
    });
  }

  /**
   * Publish tool result event
   */
  static async publishToolResult(
    runId: string,
    subtaskId: string,
    data: {
      toolName: string;
      success: boolean;
      result?: any;
      error?: string;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      subtaskId,
      eventType: 'TOOL_RESULT',
      message: data.success
        ? `Tool ${data.toolName} completed successfully`
        : `Tool ${data.toolName} failed`,
      data,
    });
  }

  /**
   * Publish step started event
   */
  static async publishStepStarted(
    runId: string,
    subtaskId: string,
    data: {
      stepName: string;
      stepIndex: number;
      totalSteps: number;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      subtaskId,
      eventType: 'STEP_STARTED',
      message: `Step ${data.stepIndex + 1}/${data.totalSteps}: ${data.stepName}`,
      data,
    });
  }

  /**
   * Publish step completed event
   */
  static async publishStepCompleted(
    runId: string,
    subtaskId: string,
    data: {
      stepName: string;
      stepIndex: number;
      result?: any;
    }
  ): Promise<void> {
    await this.publishEvent({
      runId,
      subtaskId,
      eventType: 'STEP_COMPLETED',
      message: `Completed: ${data.stepName}`,
      data,
    });
  }
}
