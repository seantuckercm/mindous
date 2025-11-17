
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { executionsTable, runsTable, runSubtasksTable, executionStateTable } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/agent/status/[executionId]
 * Get execution status and details
 * 
 * Response:
 * {
 *   "success": true,
 *   "execution": {
 *     "id": "uuid",
 *     "status": "running",
 *     "startTime": "2024-01-01T00:00:00Z",
 *     "endTime": null
 *   },
 *   "run": {
 *     "id": "uuid",
 *     "status": "running",
 *     "totalSteps": 5,
 *     "completedSteps": 2
 *   },
 *   "currentState": {
 *     "currentStep": "Generating component",
 *     "stepIndex": 2,
 *     "totalSteps": 5,
 *     "progress": 40
 *   },
 *   "subtasks": [...],
 *   "artifacts": [...]
 * }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { executionId } = await params;

    // Get execution details
    const execution = await db.query.executionsTable.findFirst({
      where: eq(executionsTable.id, executionId),
    });

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Get run details
    const run = await db.query.runsTable.findFirst({
      where: and(
        eq(runsTable.executionId, executionId),
        eq(runsTable.userId, userId)
      ),
    });

    if (!run) {
      return NextResponse.json(
        { success: false, error: 'Run not found or access denied' },
        { status: 404 }
      );
    }

    // Get current state (latest state record)
    const currentState = await db
      .select()
      .from(executionStateTable)
      .where(eq(executionStateTable.executionId, executionId))
      .orderBy(desc(executionStateTable.createdAt))
      .limit(1);

    // Get subtasks
    const subtasks = await db
      .select()
      .from(runSubtasksTable)
      .where(eq(runSubtasksTable.runId, run.id))
      .orderBy(runSubtasksTable.orderIndex);

    // Get artifacts from state
    const artifacts = currentState[0]?.artifacts || [];

    // Calculate progress
    const progress = run.totalSteps > 0
      ? Math.round((run.completedSteps / run.totalSteps) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        error: execution.error,
      },
      run: {
        id: run.id,
        status: run.status,
        title: run.title,
        description: run.description,
        totalSteps: run.totalSteps,
        completedSteps: run.completedSteps,
        progress,
      },
      currentState: currentState[0] ? {
        currentStep: currentState[0].currentStep,
        stepIndex: currentState[0].stepIndex,
        totalSteps: currentState[0].totalSteps,
        progress: currentState[0].totalSteps > 0
          ? Math.round((currentState[0].stepIndex / currentState[0].totalSteps) * 100)
          : 0,
      } : null,
      subtasks: subtasks.map((st) => ({
        id: st.id,
        title: st.title,
        description: st.description,
        status: st.status,
        orderIndex: st.orderIndex,
        startedAt: st.startedAt,
        finishedAt: st.finishedAt,
        error: st.error,
      })),
      artifacts,
    });
  } catch (error: any) {
    console.error('❌ Failed to get execution status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get execution status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
