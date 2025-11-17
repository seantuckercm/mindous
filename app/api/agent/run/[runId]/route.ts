import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentRuns, agentSubtasks } from '@/db/schema/chat';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const run = await db.query.agentRuns.findFirst({
      where: eq(agentRuns.id, params.runId),
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const subtasks = await db.query.agentSubtasks.findMany({
      where: eq(agentSubtasks.runId, params.runId),
      orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
    });

    const completedSubtasks = subtasks.filter(s => s.status === 'completed').length;
    const currentSubtask = subtasks.findIndex(s => s.status === 'running') + 1;

    return NextResponse.json({
      id: run.id,
      status: run.status,
      title: subtasks[currentSubtask - 1]?.title || 'Processing...',
      statusDetail: run.status === 'running' 
        ? `Executing subtask ${currentSubtask} of ${subtasks.length}`
        : run.status,
      currentSubtask: currentSubtask || completedSubtasks,
      totalSubtasks: subtasks.length,
      subtasks: subtasks.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        result: s.result,
        error: s.error,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch run' },
      { status: 500 }
    );
  }
}
