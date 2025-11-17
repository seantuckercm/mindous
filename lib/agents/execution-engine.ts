import { db } from '@/db';
import {
  executionsTable,
  runsTable,
  runSubtasksTable,
  executionStateTable,
  codeGenerationsTable,
  buildsTable,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { decomposeTask } from '@/lib/services/planning-service';
import { generateCode, CodeGenerationRequest } from '@/lib/services/code-generator';
import { EventPublisher } from '@/lib/services/event-publisher';
import { routeAndExecute } from '@/lib/llm/router';

/**
 * Agent Execution Engine
 * Core autonomous execution system that manages the full lifecycle
 * of task execution, from planning to completion.
 */

export interface ExecuteTaskParams {
  executionId: string;
  runId: string;
  userId: string;
  prompt: string;
  context?: {
    taskType?: 'code' | 'writing' | 'analysis' | 'extraction' | 'reasoning';
    complexity?: 'low' | 'medium' | 'high';
    constraints?: string[];
  };
}

export interface ExecutionResult {
  executionId: string;
  runId: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
  artifacts?: Array<{
    type: string;
    path: string;
    content?: string;
  }>;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  totalSteps: number;
  estimatedDurationMs: number;
}

export interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  type: 'analyze' | 'plan' | 'code' | 'build' | 'tool' | 'review';
  action: () => Promise<any>;
  dependencies?: string[];
}

export interface AgentState {
  executionId: string;
  runId: string;
  currentStep: string;
  stepIndex: number;
  totalSteps: number;
  context: Record<string, any>;
  variables: Record<string, any>;
  artifacts: Array<{ type: string; path: string; content?: string }>;
  cancelled: boolean;
}

export class AgentExecutionEngine {
  private state: AgentState;
  private userId: string;

  constructor(params: ExecuteTaskParams) {
    this.userId = params.userId;
    this.state = {
      executionId: params.executionId,
      runId: params.runId,
      currentStep: 'initializing',
      stepIndex: 0,
      totalSteps: 0,
      context: params.context || {},
      variables: {
        prompt: params.prompt,
      },
      artifacts: [],
      cancelled: false,
    };
  }

  /**
   * Main execution loop
   */
  async executeTask(params: ExecuteTaskParams): Promise<ExecutionResult> {
    const { executionId, runId, prompt } = params;

    try {
      console.log(`🚀 Starting agent execution for run ${runId}`);

      // Update execution status
      await db
        .update(executionsTable)
        .set({ status: 'running', startTime: new Date() })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(runsTable)
        .set({ status: 'running', startedAt: new Date() })
        .where(eq(runsTable.id, runId));

      // Publish execution started event
      await EventPublisher.publishExecutionStarted(runId, { executionId, prompt });

      // Plan execution
      const plan = await this.planExecution(prompt, params.context);
      this.state.totalSteps = plan.totalSteps;

      // Save initial state
      await this.saveState();

      // Execute steps
      await this.executeSteps(plan);

      // Mark as completed
      await db
        .update(executionsTable)
        .set({
          status: 'completed',
          endTime: new Date(),
        })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(runsTable)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(runsTable.id, runId));

      // Publish completion event
      await EventPublisher.publishExecutionCompleted(runId, {
        executionId,
        result: { artifacts: this.state.artifacts },
      });

      console.log(`✅ Agent execution completed for run ${runId}`);

      return {
        executionId,
        runId,
        status: 'completed',
        artifacts: this.state.artifacts,
      };
    } catch (error: any) {
      console.error(`❌ Agent execution failed for run ${runId}:`, error);

      // Update status to failed
      await db
        .update(executionsTable)
        .set({
          status: 'failed',
          endTime: new Date(),
          error: error.message,
        })
        .where(eq(executionsTable.id, executionId));

      await db
        .update(runsTable)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(runsTable.id, runId));

      // Publish failure event
      await EventPublisher.publishExecutionFailed(runId, {
        executionId,
        error: error.message,
      });

      return {
        executionId,
        runId,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Plan execution based on user prompt
   */
  private async planExecution(
    prompt: string,
    context?: ExecuteTaskParams['context']
  ): Promise<ExecutionPlan> {
    console.log('📋 Planning execution...');

    this.state.currentStep = 'planning';
    await this.saveState();

    // Use LLM to decompose task
    const plan = await decomposeTask(
      {
        goalTitle: 'Agent Execution Task',
        goalDescription: prompt,
        context: {
          taskType: context?.taskType || 'code',
          complexity: context?.complexity || 'medium',
          constraints: context?.constraints || [],
        },
      },
      this.userId
    );

    // Convert plan to execution steps
    const steps: ExecutionStep[] = [];
    let stepIndex = 0;

    for (const task of plan.tasks) {
      steps.push({
        id: `step-${stepIndex}`,
        name: task.title,
        description: task.description || '',
        type: this.determineStepType(task.type),
        action: async () => {
          return await this.executeStep(task.title, task.description || '', task.type);
        },
      });
      stepIndex++;
    }

    console.log(`📋 Created execution plan with ${steps.length} steps`);

    return {
      steps,
      totalSteps: steps.length,
      estimatedDurationMs: plan.estimate?.time_minutes
        ? plan.estimate.time_minutes * 60 * 1000
        : 300000, // Default 5 minutes
    };
  }

  /**
   * Determine step type from task type
   */
  private determineStepType(
    taskType: string
  ): ExecutionStep['type'] {
    switch (taskType) {
      case 'research':
        return 'analyze';
      case 'analysis':
        return 'analyze';
      case 'action':
        return 'code';
      case 'review':
        return 'review';
      default:
        return 'code';
    }
  }

  /**
   * Execute all steps in the plan
   */
  private async executeSteps(plan: ExecutionPlan): Promise<void> {
    for (let i = 0; i < plan.steps.length; i++) {
      // Check if cancelled
      if (this.state.cancelled) {
        console.log('⚠️ Execution cancelled by user');
        throw new Error('Execution cancelled by user');
      }

      const step = plan.steps[i];
      this.state.currentStep = step.name;
      this.state.stepIndex = i;

      console.log(`▶️ Executing step ${i + 1}/${plan.totalSteps}: ${step.name}`);

      // Create subtask
      const [subtask] = await db
        .insert(runSubtasksTable)
        .values({
          runId: this.state.runId,
          title: step.name,
          description: step.description,
          status: 'in_progress',
          orderIndex: i,
        })
        .returning();

      // Publish step started event
      await EventPublisher.publishStepStarted(this.state.runId, subtask.id, {
        stepName: step.name,
        stepIndex: i,
        totalSteps: plan.totalSteps,
      });

      // Publish progress event
      await EventPublisher.publishExecutionProgress(this.state.runId, {
        currentStep: step.name,
        stepIndex: i,
        totalSteps: plan.totalSteps,
        progress: Math.round((i / plan.totalSteps) * 100),
      });

      try {
        // Execute step action
        const result = await step.action();

        // Update subtask as completed
        await db
          .update(runSubtasksTable)
          .set({
            status: 'completed',
            result: result ? JSON.parse(JSON.stringify(result)) : null,
            finishedAt: new Date(),
          })
          .where(eq(runSubtasksTable.id, subtask.id));

        // Publish step completed event
        await EventPublisher.publishStepCompleted(this.state.runId, subtask.id, {
          stepName: step.name,
          stepIndex: i,
          result,
        });

        // Save state after each step
        await this.saveState();

        console.log(`✅ Completed step ${i + 1}/${plan.totalSteps}: ${step.name}`);
      } catch (stepError: any) {
        console.error(`❌ Step failed: ${step.name}`, stepError);

        // Update subtask as failed
        await db
          .update(runSubtasksTable)
          .set({
            status: 'failed',
            error: stepError.message,
            finishedAt: new Date(),
          })
          .where(eq(runSubtasksTable.id, subtask.id));

        // For now, continue with other steps even if one fails
        // In production, you might want to implement retry logic or halt execution
        console.log(`⚠️ Continuing with next step despite failure`);
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    title: string,
    description: string,
    taskType: string
  ): Promise<any> {
    // Determine action based on task type and description
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();

    // Check if this is a code generation task
    if (
      lowerTitle.includes('create') ||
      lowerTitle.includes('build') ||
      lowerTitle.includes('generate') ||
      lowerTitle.includes('implement') ||
      taskType === 'action'
    ) {
      // Determine what to generate
      if (lowerDesc.includes('component') || lowerTitle.includes('component')) {
        return await this.generateComponentCode(title, description);
      } else if (lowerDesc.includes('api') || lowerTitle.includes('api')) {
        return await this.generateAPICode(title, description);
      } else if (lowerDesc.includes('page') || lowerTitle.includes('page')) {
        return await this.generatePageCode(title, description);
      } else {
        // Generic code generation
        return await this.generateGenericCode(title, description);
      }
    }

    // For analysis/research tasks, use LLM to gather information
    if (taskType === 'research' || taskType === 'analysis') {
      return await this.performAnalysis(title, description);
    }

    // Default: Use LLM to process the step
    return await this.processWithLLM(title, description);
  }

  /**
   * Generate component code
   */
  private async generateComponentCode(title: string, description: string): Promise<any> {
    console.log(`🔨 Generating component: ${title}`);

    const codeResult = await generateCode({
      prompt: `${title}\n\n${description}`,
      type: 'component',
      framework: 'nextjs',
      language: 'typescript',
      userId: this.userId,
    });

    // Store code generation
    await db.insert(codeGenerationsTable).values({
      runId: this.state.runId,
      userId: this.userId,
      prompt: `${title}\n\n${description}`,
      generatedCode: codeResult.code,
      language: codeResult.language,
      framework: codeResult.framework || null,
      llmProvider: codeResult.provider,
      llmModel: codeResult.model,
      tokensUsed: codeResult.tokensUsed || null,
      validationStatus: 'unchecked',
    });

    // Add to artifacts
    this.state.artifacts.push({
      type: 'code',
      path: codeResult.fileName || 'component.tsx',
      content: codeResult.code,
    });

    return {
      type: 'component',
      fileName: codeResult.fileName,
      language: codeResult.language,
    };
  }

  /**
   * Generate API code
   */
  private async generateAPICode(title: string, description: string): Promise<any> {
    console.log(`🔨 Generating API: ${title}`);

    const codeResult = await generateCode({
      prompt: `${title}\n\n${description}`,
      type: 'api',
      framework: 'nextjs',
      language: 'typescript',
      userId: this.userId,
    });

    // Store code generation
    await db.insert(codeGenerationsTable).values({
      runId: this.state.runId,
      userId: this.userId,
      prompt: `${title}\n\n${description}`,
      generatedCode: codeResult.code,
      language: codeResult.language,
      framework: codeResult.framework || null,
      llmProvider: codeResult.provider,
      llmModel: codeResult.model,
      tokensUsed: codeResult.tokensUsed || null,
      validationStatus: 'unchecked',
    });

    // Add to artifacts
    this.state.artifacts.push({
      type: 'code',
      path: codeResult.fileName || 'route.ts',
      content: codeResult.code,
    });

    return {
      type: 'api',
      fileName: codeResult.fileName,
      language: codeResult.language,
    };
  }

  /**
   * Generate page code
   */
  private async generatePageCode(title: string, description: string): Promise<any> {
    console.log(`🔨 Generating page: ${title}`);

    const codeResult = await generateCode({
      prompt: `${title}\n\n${description}`,
      type: 'page',
      framework: 'nextjs',
      language: 'typescript',
      userId: this.userId,
    });

    // Store code generation
    await db.insert(codeGenerationsTable).values({
      runId: this.state.runId,
      userId: this.userId,
      prompt: `${title}\n\n${description}`,
      generatedCode: codeResult.code,
      language: codeResult.language,
      framework: codeResult.framework || null,
      llmProvider: codeResult.provider,
      llmModel: codeResult.model,
      tokensUsed: codeResult.tokensUsed || null,
      validationStatus: 'unchecked',
    });

    // Add to artifacts
    this.state.artifacts.push({
      type: 'code',
      path: codeResult.fileName || 'page.tsx',
      content: codeResult.code,
    });

    return {
      type: 'page',
      fileName: codeResult.fileName,
      language: codeResult.language,
    };
  }

  /**
   * Generate generic code
   */
  private async generateGenericCode(title: string, description: string): Promise<any> {
    console.log(`🔨 Generating code: ${title}`);

    const codeResult = await generateCode({
      prompt: `${title}\n\n${description}`,
      type: 'utility',
      language: 'typescript',
      userId: this.userId,
    });

    // Store code generation
    await db.insert(codeGenerationsTable).values({
      runId: this.state.runId,
      userId: this.userId,
      prompt: `${title}\n\n${description}`,
      generatedCode: codeResult.code,
      language: codeResult.language,
      framework: codeResult.framework || null,
      llmProvider: codeResult.provider,
      llmModel: codeResult.model,
      tokensUsed: codeResult.tokensUsed || null,
      validationStatus: 'unchecked',
    });

    // Add to artifacts
    this.state.artifacts.push({
      type: 'code',
      path: codeResult.fileName || 'index.ts',
      content: codeResult.code,
    });

    return {
      type: 'code',
      fileName: codeResult.fileName,
      language: codeResult.language,
    };
  }

  /**
   * Perform analysis using LLM
   */
  private async performAnalysis(title: string, description: string): Promise<any> {
    console.log(`🔍 Performing analysis: ${title}`);

    const response = await routeAndExecute({
      prompt: `${title}\n\n${description}\n\nProvide a detailed analysis.`,
      system: 'You are an expert analyst. Provide thorough, insightful analysis.',
      context: {
        taskType: 'analysis',
        complexity: 'medium',
        maxTokens: 2000,
      },
      userId: this.userId,
    });

    return {
      type: 'analysis',
      content: response.content,
      provider: response.provider,
      model: response.model,
    };
  }

  /**
   * Process step with LLM
   */
  private async processWithLLM(title: string, description: string): Promise<any> {
    console.log(`🤖 Processing with LLM: ${title}`);

    const response = await routeAndExecute({
      prompt: `${title}\n\n${description}`,
      system: 'You are a helpful AI assistant. Complete the requested task.',
      context: {
        taskType: 'reasoning',
        complexity: 'medium',
        maxTokens: 1500,
      },
      userId: this.userId,
    });

    return {
      type: 'llm_processing',
      content: response.content,
      provider: response.provider,
      model: response.model,
    };
  }

  /**
   * Save execution state to database
   */
  private async saveState(): Promise<void> {
    try {
      await db.insert(executionStateTable).values({
        executionId: this.state.executionId,
        runId: this.state.runId,
        currentStep: this.state.currentStep,
        stepIndex: this.state.stepIndex,
        totalSteps: this.state.totalSteps,
        context: this.state.context as any,
        variables: this.state.variables as any,
        artifacts: this.state.artifacts as any,
      });
    } catch (error) {
      console.error('Failed to save execution state:', error);
      // Don't throw - state saving should not break execution
    }
  }

  /**
   * Cancel execution
   */
  async cancel(): Promise<void> {
    this.state.cancelled = true;
    console.log(`⚠️ Execution cancelled for run ${this.state.runId}`);

    await db
      .update(executionsTable)
      .set({ status: 'cancelled', endTime: new Date() })
      .where(eq(executionsTable.id, this.state.executionId));

    await db
      .update(runsTable)
      .set({ status: 'cancelled', completedAt: new Date() })
      .where(eq(runsTable.id, this.state.runId));
  }

  /**
   * Get current execution status
   */
  getStatus(): {
    currentStep: string;
    stepIndex: number;
    totalSteps: number;
    progress: number;
  } {
    return {
      currentStep: this.state.currentStep,
      stepIndex: this.state.stepIndex,
      totalSteps: this.state.totalSteps,
      progress:
        this.state.totalSteps > 0
          ? Math.round((this.state.stepIndex / this.state.totalSteps) * 100)
          : 0,
    };
  }
}

/**
 * Create and start agent execution
 * This is the main entry point for starting an agent execution
 */
export async function createAndExecuteAgent(
  params: ExecuteTaskParams
): Promise<ExecutionResult> {
  const engine = new AgentExecutionEngine(params);
  return await engine.executeTask(params);
}
