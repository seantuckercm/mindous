import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { decomposeTask } from '@/lib/services/planning-service';
import { DecomposeTaskInputSchema } from '@/lib/schemas/planning-schema';
import { ZodError } from 'zod';

/**
 * POST /api/tasks/decompose
 * Decomposes a complex task into structured subtasks with dependencies
 * 
 * Request body:
 * {
 *   "goalTitle": "Create a todo app",
 *   "goalDescription": "Build a full-stack todo application with auth",
 *   "context": {
 *     "taskType": "code",
 *     "complexity": "medium",
 *     "constraints": ["Must use Next.js", "Maximum 2 hours"]
 *   },
 *   "feedback": "Make it more detailed",
 *   "previousVersion": 1
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "plan": {
 *     "overview": { ... },
 *     "estimate": { tokens: 10000, usd: 0.15, time_minutes: 30 },
 *     "tasks": [ ... ]
 *   }
 * }
 */
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
    
    let validatedInput;
    try {
      validatedInput = DecomposeTaskInputSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request',
            details: err.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw err;
    }

    // Check for required fields
    if (!validatedInput.goalTitle || validatedInput.goalTitle.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Goal title is required' },
        { status: 400 }
      );
    }

    console.log(`[Task Decomposition] Starting for user ${userId}: "${validatedInput.goalTitle}"`);

    // Call planning service
    const startTime = Date.now();
    const plan = await decomposeTask(validatedInput, userId);
    const duration = Date.now() - startTime;

    console.log(`[Task Decomposition] Completed in ${duration}ms, generated ${plan.tasks.length} tasks`);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        plan,
        metadata: {
          duration_ms: duration,
          task_count: plan.tasks.length,
          generated_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Task Decomposition] Error:', err);

    // Handle specific error types
    if (err.message?.includes('No available providers')) {
      return NextResponse.json(
        {
          success: false,
          error: 'LLM service temporarily unavailable',
          details: 'All language model providers are currently unavailable. Please try again in a moment.',
        },
        { status: 503 }
      );
    }

    if (err.message?.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please wait a moment before trying again.',
        },
        { status: 429 }
      );
    }

    if (err.message?.includes('Task decomposition failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate plan',
          details: err.message,
          retry: true,
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/decompose
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tasks/decompose',
    method: 'POST',
    description: 'Decomposes a complex task into structured subtasks with dependencies',
    authentication: 'Required (Clerk)',
    request: {
      goalTitle: 'string (required, max 500 chars)',
      goalDescription: 'string (optional)',
      context: {
        taskType: 'code | writing | analysis | extraction | reasoning (optional)',
        complexity: 'low | medium | high (optional)',
        constraints: 'string[] (optional)',
        preferences: 'Record<string, string> (optional)',
      },
      feedback: 'string (optional, for regeneration)',
      previousVersion: 'number (optional, for regeneration)',
    },
    response: {
      success: 'boolean',
      plan: {
        overview: {
          objective: 'string',
          assumptions: 'string[]',
          constraints: 'string[]',
          success_criteria: 'string[]',
          overall_strategy: 'string',
          risk_notes: 'string[]',
        },
        estimate: {
          tokens: 'number',
          usd: 'number',
          time_minutes: 'number',
        },
        tasks: 'TaskNode[]',
      },
      metadata: {
        duration_ms: 'number',
        task_count: 'number',
        generated_at: 'string (ISO date)',
      },
    },
    examples: {
      simple: {
        goalTitle: 'Create a landing page',
        goalDescription: 'Build a modern landing page with hero section and CTA',
        context: {
          taskType: 'code',
          complexity: 'low',
        },
      },
      complex: {
        goalTitle: 'Build a full-stack e-commerce platform',
        goalDescription: 'Complete e-commerce solution with payment processing',
        context: {
          taskType: 'code',
          complexity: 'high',
          constraints: ['Use Next.js 14', 'Implement Stripe payments', 'Add admin dashboard'],
        },
        feedback: 'Break down the payment integration into more steps',
        previousVersion: 1,
      },
    },
  });
}
