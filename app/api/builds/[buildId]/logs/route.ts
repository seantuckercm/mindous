
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BuildService } from '@/lib/services/build-service';

/**
 * GET /api/builds/[buildId]/logs
 * Get build logs (as SSE stream or plain text)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buildId } = await params;

    // Get build to verify ownership
    const build = await BuildService.getBuildStatus(buildId);

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get logs
    const logs = await BuildService.getBuildLogs(buildId);

    // Check if client wants SSE
    const acceptHeader = request.headers.get('accept');
    const wantsSSE = acceptHeader?.includes('text/event-stream');

    if (wantsSSE) {
      // Return as SSE stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Split logs into lines and send as events
          const lines = logs.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const event = `data: ${JSON.stringify({ log: line })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
          }
          
          // Send completion event
          const doneEvent = `data: ${JSON.stringify({ done: true })}\n\n`;
          controller.enqueue(encoder.encode(doneEvent));
          
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // Return as plain text
      return new Response(logs, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }

  } catch (error: any) {
    console.error('Failed to get build logs:', error);
    return NextResponse.json(
      { error: 'Failed to get build logs', details: error.message },
      { status: 500 }
    );
  }
}
