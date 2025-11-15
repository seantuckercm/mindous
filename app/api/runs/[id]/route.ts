import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tasksTable, executionsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/runs/[id] - Fetch run status with all related data
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Fetch the main task with its execution
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

    const mainTaskData = mainTaskResults[0];
    const mainTask = mainTaskData.tasks;
    const mainExecution = mainTaskData.executions;

    // Fetch all subtasks with their executions
    const subtaskResults = await db
      .select()
      .from(tasksTable)
      .leftJoin(executionsTable, eq(executionsTable.taskId, tasksTable.id))
      .where(eq(tasksTable.parentTaskId, id))
      .orderBy(tasksTable.createdAt);

    // Map database data to frontend format
    const subtasks = subtaskResults.map((result) => {
      const subtask = result.tasks;
      const execution = result.executions;

      return {
        id: subtask.id,
        title: subtask.title,
        status: mapTaskStatusToFrontend(subtask.status, execution?.status),
        statusDetail: subtask.description || execution?.error || '',
        startedAt: execution?.startTime,
        finishedAt: execution?.endTime,
        errorMessage: execution?.error,
        order: (subtask.metadata as any)?.order || 0
      };
    });

    // Calculate progress
    const completedCount = subtasks.filter(
      (st) => st.status === 'succeeded' || st.status === 'failed'
    ).length;
    const progress = subtasks.length > 0 
      ? Math.round((completedCount / subtasks.length) * 100)
      : 0;

    // Map main task status
    const runStatus = mapTaskStatusToFrontend(
      mainTask.status,
      mainExecution?.status
    );

    // Return formatted run data
    return NextResponse.json({
      id: mainTask.id,
      title: mainTask.title,
      status: runStatus,
      startedAt: mainExecution?.startTime || mainTask.createdAt,
      finishedAt: mainExecution?.endTime,
      subtasks: subtasks.sort((a, b) => a.order - b.order),
      progress,
      error: mainExecution?.error
    });

  } catch (error) {
    console.error('Error fetching run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch run data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/runs/[id] - Update run status (pause, resume, cancel)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['pause', 'resume', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be pause, resume, or cancel' },
        { status: 400 }
      );
    }

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

    // Determine new status based on action
    let newExecutionStatus: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
    let newTaskStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

    switch (action) {
      case 'pause':
        // Note: We don't have a 'paused' status in the schema, so we'll use 'queued' 
        // In a real implementation, you might want to add a 'paused' status to the enum
        newExecutionStatus = 'queued';
        newTaskStatus = 'pending';
        break;
      case 'resume':
        newExecutionStatus = 'running';
        newTaskStatus = 'in_progress';
        break;
      case 'cancel':
        newExecutionStatus = 'cancelled';
        newTaskStatus = 'cancelled';
        break;
    }

    // Update execution status
    const [updatedExecution] = await db
      .update(executionsTable)
      .set({
        status: newExecutionStatus,
        error: action === 'cancel' && reason ? reason : mainExecution.error,
        updatedAt: new Date()
      })
      .where(eq(executionsTable.id, mainExecution.id))
      .returning();

    // Update task status
    const [updatedTask] = await db
      .update(tasksTable)
      .set({
        status: newTaskStatus,
        updatedAt: new Date()
      })
      .where(eq(tasksTable.id, id))
      .returning();

    // If canceling, also cancel all pending subtasks
    if (action === 'cancel') {
      // Fetch all subtasks
      const subtasks = await db
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.parentTaskId, id));

      // Update all non-completed subtasks to cancelled
      for (const subtask of subtasks) {
        if (subtask.status === 'pending' || subtask.status === 'in_progress') {
          await db
            .update(tasksTable)
            .set({
              status: 'cancelled',
              updatedAt: new Date()
            })
            .where(eq(tasksTable.id, subtask.id));

          // Update subtask executions
          await db
            .update(executionsTable)
            .set({
              status: 'cancelled',
              updatedAt: new Date()
            })
            .where(eq(executionsTable.taskId, subtask.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTask.id,
        status: updatedTask.status,
        executionStatus: updatedExecution.status,
        updatedAt: updatedTask.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update run',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to map database statuses to frontend statuses
function mapTaskStatusToFrontend(
  taskStatus: string,
  executionStatus?: string | null
): 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' {
  // If execution exists, prioritize its status
  if (executionStatus) {
    switch (executionStatus) {
      case 'running':
        return 'running';
      case 'completed':
        return 'succeeded';
      case 'failed':
      case 'timeout':
        return 'failed';
      case 'cancelled':
        return 'canceled';
      case 'queued':
        return 'queued';
    }
  }

  // Fall back to task status
  switch (taskStatus) {
    case 'in_progress':
      return 'running';
    case 'completed':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'canceled';
    case 'pending':
    default:
      return 'queued';
  }
}
