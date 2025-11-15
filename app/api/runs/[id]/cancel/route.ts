
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tasksTable, executionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

// PATCH /api/runs/[id]/cancel - Cancel a running or queued execution
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Fetch the main task and execution
    const mainTaskResults = await db
      .select()
      .from(tasksTable)
      .leftJoin(executionsTable, eq(executionsTable.taskId, tasksTable.id))
      .where(eq(tasksTable.id, id));

    if (mainTaskResults.length === 0) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    const mainTask = mainTaskResults[0].tasks;
    const mainExecution = mainTaskResults[0].executions;

    if (!mainExecution) {
      return NextResponse.json(
        { error: 'Execution not found for this task' },
        { status: 404 }
      );
    }

    // Check if execution can be cancelled
    if (mainExecution.status === 'completed' || mainExecution.status === 'cancelled') {
      return NextResponse.json(
        { 
          error: 'Cannot cancel execution',
          details: `Execution is already ${mainExecution.status}`
        },
        { status: 400 }
      );
    }

    // Update execution status to cancelled
    const errorMessage = reason || mainExecution.error || 'Execution cancelled by user';
    const [updatedExecution] = await db
      .update(executionsTable)
      .set({
        status: 'cancelled',
        error: errorMessage,
        endTime: new Date(),
        updatedAt: new Date()
      })
      .where(eq(executionsTable.id, mainExecution.id))
      .returning();

    // Update task status
    const [updatedTask] = await db
      .update(tasksTable)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(tasksTable.id, id))
      .returning();

    // Cancel all pending or running subtasks
    const subtasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.parentTaskId, id));

    for (const subtask of subtasks) {
      if (subtask.status === 'pending' || subtask.status === 'in_progress') {
        // Update subtask
        await db
          .update(tasksTable)
          .set({
            status: 'cancelled',
            updatedAt: new Date()
          })
          .where(eq(tasksTable.id, subtask.id));

        // Update subtask execution
        await db
          .update(executionsTable)
          .set({
            status: 'cancelled',
            error: 'Parent task cancelled',
            updatedAt: new Date()
          })
          .where(eq(executionsTable.taskId, subtask.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Run cancelled successfully',
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        executionStatus: updatedExecution.status,
        reason: errorMessage,
        updatedAt: updatedTask.updatedAt
      }
    });

  } catch (error) {
    console.error('Error cancelling run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel run',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
