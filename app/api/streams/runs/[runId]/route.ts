import { NextRequest } from "next/server";
import { db } from "@/db";
import { runEventsTable, runsTable } from "@/db/schema/progress-stream-schema";
import { subscribeToChannel, getRunChannel, unsubscribeAndDisconnect } from "@/lib/redis";
import { eq, gte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import Redis from "ioredis";

// Keep track of active connections for cleanup
const activeConnections = new Map<string, { subscriber: Redis; controller: AbortController }>();

/**
 * GET /api/streams/runs/[runId]
 * Server-Sent Events endpoint for real-time run progress updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const resolvedParams = await params;
  const { runId } = resolvedParams;
  
  // Authenticate user
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify run exists and belongs to user
  const [run] = await db
    .select()
    .from(runsTable)
    .where(eq(runsTable.id, runId))
    .limit(1);

  if (!run) {
    return new Response("Run not found", { status: 404 });
  }

  if (run.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const connectionId = `${userId}-${runId}-${Date.now()}`;
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
        // 1. Get lastEventId from query params for event replay
        const url = new URL(request.url);
        const lastEventId = url.searchParams.get("lastEventId");
        const lastEventTimestamp = lastEventId ? new Date(lastEventId) : null;

        // 2. Send initial connection event
        sendEvent("connected", {
          runId,
          timestamp: new Date().toISOString()
        });

        // 3. Replay missed events from database (if reconnecting)
        if (lastEventTimestamp) {
          const missedEvents = await db
            .select()
            .from(runEventsTable)
            .where(
              eq(runEventsTable.runId, runId)
            )
            .orderBy(runEventsTable.timestamp);

          // Filter events after lastEventTimestamp
          const eventsToReplay = missedEvents.filter(
            event => event.timestamp > lastEventTimestamp
          );

          for (const event of eventsToReplay) {
            sendEvent("event", {
              id: event.id,
              runId: event.runId,
              subtaskId: event.subtaskId,
              eventType: event.eventType,
              message: event.message,
              data: event.data,
              timestamp: event.timestamp.toISOString()
            });
          }

          if (eventsToReplay.length > 0) {
            sendEvent("replay-complete", {
              count: eventsToReplay.length
            });
          }
        } else {
          // Send all historical events for initial connection
          const historicalEvents = await db
            .select()
            .from(runEventsTable)
            .where(eq(runEventsTable.runId, runId))
            .orderBy(runEventsTable.timestamp);

          for (const event of historicalEvents) {
            sendEvent("event", {
              id: event.id,
              runId: event.runId,
              subtaskId: event.subtaskId,
              eventType: event.eventType,
              message: event.message,
              data: event.data,
              timestamp: event.timestamp.toISOString()
            });
          }

          if (historicalEvents.length > 0) {
            sendEvent("history-complete", {
              count: historicalEvents.length
            });
          }
        }

        // 4. Subscribe to Redis channel for real-time events
        const channel = getRunChannel(runId);
        const subscriber = await subscribeToChannel(channel, (message) => {
          try {
            sendEvent("event", message);
          } catch (error) {
            console.error("Error sending event:", error);
          }
        });

        // Store connection for cleanup
        activeConnections.set(connectionId, { subscriber, controller: abortController });

        // 5. Set up heartbeat interval (every 15 seconds)
        const heartbeatInterval = setInterval(() => {
          try {
            sendHeartbeat();
          } catch (error) {
            console.error("Error sending heartbeat:", error);
            clearInterval(heartbeatInterval);
          }
        }, 15000);

        // 6. Handle client disconnect
        abortController.signal.addEventListener("abort", async () => {
          console.log(`Client disconnected: ${connectionId}`);
          clearInterval(heartbeatInterval);
          
          try {
            await unsubscribeAndDisconnect(subscriber, channel);
          } catch (error) {
            console.error("Error during cleanup:", error);
          }
          
          activeConnections.delete(connectionId);
          
          try {
            controller.close();
          } catch (error) {
            // Controller might already be closed
          }
        });

        // 7. Check if run is already completed
        if (["completed", "failed", "cancelled"].includes(run.status)) {
          sendEvent("run-finished", {
            status: run.status,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error("Error in SSE stream:", error);
        sendEvent("error", {
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        });
        
        try {
          controller.close();
        } catch (closeError) {
          // Controller might already be closed
        }
      }
    },

    cancel() {
      console.log("Stream cancelled by client");
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering for Nginx
    },
  });
}

// Cleanup on server shutdown (Next.js specific)
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    console.log("Cleaning up SSE connections...");
    for (const [connectionId, { subscriber, controller }] of activeConnections.entries()) {
      try {
        controller.abort();
        await subscriber.quit();
        activeConnections.delete(connectionId);
      } catch (error) {
        console.error(`Error cleaning up connection ${connectionId}:`, error);
      }
    }
  });
}
