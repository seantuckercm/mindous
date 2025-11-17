
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chatMessages, chatSessions } from '@/db/schema/chat';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, content } = await req.json();

    // Verify session belongs to user
    const [session] = await db.select().from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Save user message to database
    await db.insert(chatMessages).values({
      sessionId,
      role: 'user',
      content,
    });

    // Get recent conversation context (last 10 messages)
    const recentMessages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt)
      .limit(10);

    // Prepare messages for LLM
    const messages = recentMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Add system message for task breakdown context
    messages.unshift({
      role: 'system' as const,
      content: `You are Mindous.ai, an AI assistant that helps break down complex tasks into manageable subtasks and executes them. When a user gives you a task:
1. Analyze the request and break it down into clear, actionable subtasks
2. Explain your approach and the steps you'll take
3. Execute the plan step by step
4. Provide clear, helpful responses

Always be conversational, helpful, and focused on practical solutions.`
    });

    // Call LLM API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        
        let fullContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader?.read() || { done: true, value: undefined };
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                    // Stream the chunk to the client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, type: 'chunk' })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
          
          // Save assistant response to database
          await db.insert(chatMessages).values({
            sessionId,
            role: 'assistant',
            content: fullContent,
          });
          
          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`));
          
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
