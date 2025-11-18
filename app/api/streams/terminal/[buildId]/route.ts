import { NextRequest } from 'next/server';
import { db } from '@/db';
import { terminalLogsTable, buildsTable } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { subscribeToChannel, unsubscribeAndDisconnect } from '@/lib/redis';
import Redis from 'ioredis';

// Track active connections
const activeConnections = new Map<string, { subscriber: Redis; controller: AbortController }>();

/**
 * GET /api/streams/terminal/[buildId]
 * Server-Sent Events endpoint for real-time terminal output
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const resolvedParams = await params;
  const { buildId } = resolvedParams;

  // Authenticate user
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify build exists
  let build;
  try {
    [build] = await db
      .select()
      .from(buildsTable)
      .where(eq(buildsTable.id, buildId))
      .limit(1);
  } catch (error) {
    console.log('Build not found in database, treating as demo build');
  }

  // Allow demo builds for testing (no database entry)
  const isDemoBuild = !build;

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const connectionId = `${userId}-${buildId}-${Date.now()}`;
      const abortController = new AbortController();

      // Helper to send SSE message
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Helper to send heartbeat
      const sendHeartbeat = () => {
        const message = `:heartbeat\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Send connection event
        sendEvent('connected', {
          buildId,
          timestamp: new Date().toISOString(),
          demo: isDemoBuild
        });

        // Replay existing terminal logs from database (only for real builds)
        if (!isDemoBuild) {
          const existingLogs = await db
            .select()
            .from(terminalLogsTable)
            .where(eq(terminalLogsTable.buildId, buildId))
            .orderBy(asc(terminalLogsTable.sequence));

          for (const log of existingLogs) {
            sendEvent(log.type, {
              id: log.id,
              buildId: log.buildId,
              command: log.type === 'command' ? log.content : undefined,
              output: log.type === 'stdout' || log.type === 'stderr' ? log.content : undefined,
              exitCode: log.exitCode,
              duration: log.duration,
              sequence: log.sequence,
              timestamp: log.timestamp.toISOString()
            });
          }
        } else {
          // Send demo terminal logs
          sendEvent('command', {
            id: 'demo-1',
            buildId,
            command: 'npm install',
            sequence: 1,
            timestamp: new Date().toISOString()
          });
          sendEvent('stdout', {
            id: 'demo-2',
            buildId,
            output: 'Installing dependencies...\n',
            sequence: 2,
            timestamp: new Date().toISOString()
          });
          sendEvent('stdout', {
            id: 'demo-3',
            buildId,
            output: 'Dependencies installed successfully!\n',
            sequence: 3,
            timestamp: new Date().toISOString()
          });
          sendEvent('command', {
            id: 'demo-4',
            buildId,
            command: 'npm run build',
            exitCode: 0,
            duration: 1234,
            sequence: 4,
            timestamp: new Date().toISOString()
          });
          sendEvent('stdout', {
            id: 'demo-5',
            buildId,
            output: 'Build completed successfully!\n',
            sequence: 5,
            timestamp: new Date().toISOString()
          });
        }

        // Subscribe to live terminal updates via Redis
        const channel = `terminal:${buildId}`;
        const subscriber = await subscribeToChannel(channel);
        
        activeConnections.set(connectionId, { subscriber, controller: abortController });

        subscriber.on('message', (channel: string, message: string) => {
          try {
            const data = JSON.parse(message);
            sendEvent(data.type, data);
          } catch (error) {
            console.error('Error parsing terminal message:', error);
          }
        });

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          if (abortController.signal.aborted) {
            clearInterval(heartbeatInterval);
            return;
          }
          sendHeartbeat();
        }, 30000);

        // Handle abort
        abortController.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          unsubscribeAndDisconnect(subscriber, channel);
          activeConnections.delete(connectionId);
          controller.close();
        });

        // Wait for build completion or connection close
        request.signal.addEventListener('abort', () => {
          abortController.abort();
        });

      } catch (error) {
        console.error('Terminal stream error:', error);
        sendEvent('error', {
          message: 'Stream error occurred',
          error: error instanceof Error ? error.message : String(error)
        });
        controller.close();
      }
    },

    cancel() {
      // Cleanup when stream is cancelled
      console.log(`Terminal stream cancelled for build ${buildId}`);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
