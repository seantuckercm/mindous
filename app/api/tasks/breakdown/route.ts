
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = "force-dynamic";

interface Subtask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
  estimatedDuration: string;
  tools: string[];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();

    // Call LLM to break down the task
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at breaking down complex tasks into manageable subtasks. 
            Analyze the user's request and break it down into clear, actionable steps.
            Respond with a JSON object containing:
            - title: Overall task title
            - description: Brief description of the main goal
            - subtasks: Array of subtasks, each with:
              - id: Unique identifier (1, 2, 3, etc.)
              - title: Short, clear title
              - description: Detailed description of what needs to be done
              - dependencies: Array of subtask IDs this depends on (empty array if none)
              - estimatedDuration: Estimate like "5 minutes", "30 minutes", etc.
              - tools: Array of tools/technologies that might be used
            
            Make the breakdown logical, with proper dependencies between tasks.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const breakdown = JSON.parse(data.choices[0].message.content);

    // Add status to each subtask
    breakdown.subtasks = breakdown.subtasks.map((task: any) => ({
      ...task,
      status: 'pending'
    }));

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Task breakdown error:', error);
    return NextResponse.json(
      { error: 'Failed to break down task' },
      { status: 500 }
    );
  }
}
