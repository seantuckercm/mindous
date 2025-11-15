
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tasksTable, executionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

// PATCH /api/runs/[id]/resume - Resume a paused execution
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

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

    // Check if execution can be resumed
    // We're using 'queued' as the paused state
    if (mainExecution.status !== 'queued' && mainTask.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Cannot resume execution',
          details: `Execution is in ${mainExecution.status} state and cannot be resumed`
        },
        { status: 400 }
      );
    }

    // Update execution status to running
    const [updatedExecution] = await db
      .update(executionsTable)
      .set({
        status: 'running',
        startTime: mainExecution.startTime || new Date(),
        updatedAt: new Date()
      })
      .where(eq(executionsTable.id, mainExecution.id))
      .returning();

    // Update task status
    const [updatedTask] = await db
      .update(tasksTable)
      .set({
        status: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(tasksTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Run resumed successfully',
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        executionStatus: updatedExecution.status,
        updatedAt: updatedTask.updatedAt
      }
    });

  } catch (error) {
    console.error('Error resuming run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to resume run',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
