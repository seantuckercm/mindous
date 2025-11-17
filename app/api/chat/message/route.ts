import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages, agentRuns, agentSubtasks } from '@/db/schema/chat';
import { auth } from '@clerk/nextjs/server';
import { decomposeTask } from '@/lib/agents/task-decomposer';
import { routeAndExecute } from '@/lib/llm/router';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId, content } = body;

    // Save user message
    const [userMessage] = await db.insert(chatMessages).values({
      sessionId,
      role: 'user',
      content,
    }).returning();

    // Create agent run
    const [agentRun] = await db.insert(agentRuns).values({
      sessionId,
      messageId: userMessage.id,
      status: 'running',
      startedAt: new Date(),
    }).returning();

    // Start task decomposition and execution in background
    executeAgentRun(agentRun.id, content).catch(console.error);

    // Return initial response
    const response = 'I\'m analyzing your request and breaking it down into subtasks...';
    
    await db.insert(chatMessages).values({
      sessionId,
      role: 'assistant',
      content: response,
    });

    return NextResponse.json({
      agentRunId: agentRun.id,
      response,
    });
  } catch (error) {
    console.error('Failed to process message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function executeAgentRun(runId: string, userRequest: string) {
  try {
    // Step 1: Decompose task into subtasks
    const decomposition = await decomposeTask(userRequest);
    
    // Step 2: Create subtasks in database
    for (let i = 0; i < decomposition.subtasks.length; i++) {
      const subtask = decomposition.subtasks[i];
      await db.insert(agentSubtasks).values({
        runId,
        title: subtask.title,
        description: subtask.description,
        orderIndex: i,
        status: 'pending',
      });
    }

    // Step 3: Execute subtasks sequentially
    const subtasks = await db.query.agentSubtasks.findMany({
      where: (fields, { eq }) => eq(fields.runId, runId),
      orderBy: (fields, { asc }) => [asc(fields.orderIndex)],
    });

    for (const subtask of subtasks) {
      // Update subtask status to running
      await db.update(agentSubtasks)
        .set({ status: 'running', startedAt: new Date() })
        .where((fields, { eq }) => eq(fields.id, subtask.id));

      try {
        // Route and execute subtask using LLM
        const result = await routeAndExecute({
          subtaskId: subtask.id,
          prompt: `${subtask.title}\n\n${subtask.description || ''}`,
          context: {
            taskType: determineTaskType(subtask.title),
            complexity: 'medium',
            allowCache: true,
          },
        });

        // Update subtask with result
        await db.update(agentSubtasks)
          .set({
            status: 'completed',
            provider: result.provider,
            model: result.model,
            result: { content: result.content },
            finishedAt: new Date(),
          })
          .where((fields, { eq }) => eq(fields.id, subtask.id));
      } catch (error: any) {
        // Mark subtask as failed
        await db.update(agentSubtasks)
          .set({
            status: 'failed',
            error: error.message,
            finishedAt: new Date(),
          })
          .where((fields, { eq }) => eq(fields.id, subtask.id));
      }
    }

    // Step 4: Mark agent run as completed
    await db.update(agentRuns)
      .set({
        status: 'completed',
        finishedAt: new Date(),
      })
      .where((fields, { eq }) => eq(fields.id, runId));

  } catch (error: any) {
    // Mark agent run as failed
    await db.update(agentRuns)
      .set({
        status: 'failed',
        error: error.message,
        finishedAt: new Date(),
      })
      .where((fields, { eq }) => eq(fields.id, runId));
  }
}

function determineTaskType(title: string): 'code' | 'writing' | 'analysis' | 'extraction' | 'reasoning' {
  const lower = title.toLowerCase();
  if (lower.includes('code') || lower.includes('program') || lower.includes('implement')) {
    return 'code';
  }
  if (lower.includes('write') || lower.includes('draft') || lower.includes('compose')) {
    return 'writing';
  }
  if (lower.includes('analyze') || lower.includes('examine') || lower.includes('study')) {
    return 'analysis';
  }
  if (lower.includes('extract') || lower.includes('scrape') || lower.includes('collect')) {
    return 'extraction';
  }
  return 'reasoning';
}
