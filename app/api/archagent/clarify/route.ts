import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  generateClarifications,
  autoDecideClarifications,
  saveClarificationAnswers,
  getClarificationSummary,
  ClarificationContext
} from '@/lib/services/clarification-service';

/**
 * POST /api/archagent/clarify
 * Generate clarification questions for a given prompt
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, prompt, plan, executionId, answers } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate': {
        if (!prompt || !executionId) {
          return NextResponse.json(
            { error: 'Prompt and executionId are required' },
            { status: 400 }
          );
        }

        const context: ClarificationContext = {
          prompt,
          plan,
          userId,
          executionId
        };

        const questions = await generateClarifications(context);

        return NextResponse.json({
          success: true,
          questions
        });
      }

      case 'auto_decide': {
        if (!prompt || !executionId) {
          return NextResponse.json(
            { error: 'Prompt and executionId are required' },
            { status: 400 }
          );
        }

        // Get the questions first
        const context: ClarificationContext = {
          prompt,
          plan,
          userId,
          executionId
        };

        const questions = await generateClarifications(context);
        const decidedAnswers = await autoDecideClarifications(questions, context);

        return NextResponse.json({
          success: true,
          answers: decidedAnswers
        });
      }

      case 'submit': {
        if (!executionId || !answers) {
          return NextResponse.json(
            { error: 'ExecutionId and answers are required' },
            { status: 400 }
          );
        }

        await saveClarificationAnswers(executionId, answers);

        return NextResponse.json({
          success: true
        });
      }

      case 'summary': {
        if (!executionId) {
          return NextResponse.json(
            { error: 'ExecutionId is required' },
            { status: 400 }
          );
        }

        const summary = await getClarificationSummary(executionId);

        return NextResponse.json({
          success: true,
          summary
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Clarification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/archagent/clarify?executionId=xxx
 * Get clarifications for an execution
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: 'ExecutionId is required' },
        { status: 400 }
      );
    }

    const summary = await getClarificationSummary(executionId);

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Clarification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
