
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAndExecuteAgent } from '@/lib/agents/execution-engine';
import { db } from '@/db';
import { executionsTable, runsTable, tasksTable } from '@/db/schema';
import { z } from 'zod';

/**
 * POST /api/agent/execute
 * Start agent execution
 * 
 * Request body:
 * {
 *   "prompt": "Create a todo app with Next.js",
 *   "context": {
 *     "taskType": "code",
 *     "complexity": "medium",
 *     "constraints": ["Use TypeScript", "Use Tailwind CSS"]
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "executionId": "uuid",
 *   "runId": "uuid",
 *   "message": "Agent execution started"
 * }
 */

const RequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  context: z
    .object({
      taskType: z.enum(['code', 'writing', 'analysis', 'extraction', 'reasoning']).optional(),
      complexity: z.enum(['low', 'medium', 'high']).optional(),
      constraints: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { prompt, context } = validation.data;

    console.log(`🚀 Agent execution requested by user ${userId}: ${prompt}`);

    // Create task record
    const [task] = await db
      .insert(tasksTable)
      .values({
        userId,
        title: prompt.slice(0, 100),
        description: prompt,
        status: 'pending',
      })
      .returning();

    // Create execution record
    const [execution] = await db
      .insert(executionsTable)
      .values({
        taskId: task.id,
        status: 'queued',
        startTime: new Date(),
      })
      .returning();

    // Create run record
    const [run] = await db
      .insert(runsTable)
      .values({
        executionId: execution.id,
        userId,
        status: 'queued',
        title: prompt.slice(0, 100),
        description: prompt,
        totalSteps: 0,
        completedSteps: 0,
      })
      .returning();

    // Start async execution (don't await - let it run in background)
    createAndExecuteAgent({
      executionId: execution.id,
      runId: run.id,
      userId,
      prompt,
      context,
    }).catch((error) => {
      console.error('❌ Agent execution failed:', error);
    });

    console.log(`✅ Agent execution started: ${execution.id}, run: ${run.id}`);

    return NextResponse.json(
      {
        success: true,
        executionId: execution.id,
        runId: run.id,
        message: 'Agent execution started',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Failed to start agent execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start agent execution',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
