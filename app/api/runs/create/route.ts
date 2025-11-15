import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tasksTable, executionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Type for request body
interface CreateRunRequest {
  title: string;
  description?: string;
  userId: string;
  metadata?: Record<string, any>;
  subtasks?: {
    title: string;
    description?: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateRunRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.userId) {
      return NextResponse.json(
        { error: 'title and userId are required' },
        { status: 400 }
      );
    }

    // Create the main task
    const [mainTask] = await db.insert(tasksTable).values({
      userId: body.userId,
      title: body.title,
      description: body.description,
      status: 'pending',
      metadata: body.metadata || {}
    }).returning();

    // Create subtasks if provided
    let subtasks = [];
    if (body.subtasks && body.subtasks.length > 0) {
      subtasks = await db.insert(tasksTable).values(
        body.subtasks.map((subtask, index) => ({
          userId: body.userId,
          title: subtask.title,
          description: subtask.description,
          status: 'pending' as const,
          parentTaskId: mainTask.id,
          metadata: { order: index + 1 }
        }))
      ).returning();
    }

    // Create main execution record
    const [execution] = await db.insert(executionsTable).values({
      taskId: mainTask.id,
      status: 'queued',
      logs: [],
      metrics: {}
    }).returning();

    // Create execution records for subtasks
    const subtaskExecutions = await Promise.all(
      subtasks.map(async (subtask) => {
        const [subtaskExec] = await db.insert(executionsTable).values({
          taskId: subtask.id,
          status: 'queued',
          logs: [],
          metrics: {}
        }).returning();
        return subtaskExec;
      })
    );

    // Return the created execution with task details
    return NextResponse.json({
      success: true,
      data: {
        executionId: execution.id,
        taskId: mainTask.id,
        status: execution.status,
        task: {
          id: mainTask.id,
          title: mainTask.title,
          description: mainTask.description,
          status: mainTask.status,
          createdAt: mainTask.createdAt,
        },
        subtasks: subtasks.map((subtask, index) => ({
          id: subtask.id,
          title: subtask.title,
          description: subtask.description,
          status: subtask.status,
          order: index + 1,
          executionId: subtaskExecutions[index]?.id
        }))
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating run:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create run',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
