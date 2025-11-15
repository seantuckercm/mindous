
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tasksTable, executionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

// PATCH /api/runs/[id]/pause - Pause a running execution
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

    // Check if execution can be paused
    if (mainExecution.status !== 'running' && mainExecution.status !== 'queued') {
      return NextResponse.json(
        { 
          error: 'Cannot pause execution',
          details: `Execution is in ${mainExecution.status} state`
        },
        { status: 400 }
      );
    }

    // Update execution status to queued (paused state)
    // Note: Schema doesn't have 'paused' status, using 'queued' as paused
    const [updatedExecution] = await db
      .update(executionsTable)
      .set({
        status: 'queued',
        updatedAt: new Date()
      })
      .where(eq(executionsTable.id, mainExecution.id))
      .returning();

    // Update task status
    const [updatedTask] = await db
      .update(tasksTable)
      .set({
        status: 'pending',
        updatedAt: new Date()
      })
      .where(eq(tasksTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Run paused successfully',
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        executionStatus: updatedExecution.status,
        updatedAt: updatedTask.updatedAt
      }
    });

  } catch (error) {
    console.error('Error pausing run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to pause run',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
