## Feature: Real-time Progress Streaming & Transparency

### Overview
Live, low-latency visibility into agent execution. Streams reasoning traces, subtask state changes, tool calls, and intermediate results to the UI as they happen. Supports pause/cancel controls, resilient reconnections, and full replay from persisted logs for trust and debuggability.

### Reference Platform Analysis
Based on comprehensive analysis of Abacus.AI's DeepAgent implementation (November 2025), this PRD incorporates proven UI/UX patterns and technical architecture decisions that prioritize transparency and user trust. Key principle: **Transparency Over Abstraction** - show what the agent is doing at all times.

### UI/UX Patterns from Reference Implementation

#### 1. Task Card Pattern (Critical)
Visual component for displaying task execution status:

```
┌─────────────────────────────────────────┐
│ [Agent Icon] [Status Icon]              │
│ Task Title: "Creating a modern HTML..." │
│ Status: In progress / Completed         │
│ Status Detail: "Initializing"           │
└─────────────────────────────────────────┘
```

**Key Features:**
- Visual hierarchy: Icon → Title → Status → Detail
- Status icons: Loading spinner, green checkmark, error indicator
- Color coding: Purple for active, green for success, red for errors
- Expandable details for logs and artifacts

#### 2. Tool Usage Visibility Panel (Critical)
Right-side panel that opens during execution showing real-time tool usage:

**Header Structure:**
- Format: "Task 1: [task name] > [current subtask]"
- Badge: "DeepAgent is using [Tool Name]"
- Clear visual separation from main content

**Tool-Specific Output Display:**
- **Search Tool:** Image grid with clickable sources
- **Terminal:** Command output with ANSI color coding preserved
- **Code Editor:** Syntax-highlighted file content with line numbers
- **File Operations:** Git-style diff view with additions/deletions

#### 3. Progress Tracking System (Critical)
Bottom status bar displaying hierarchical progress:

**Format:** "Task X, Subtask Y"
- Subtask counter increments in real-time as work progresses
- Clear indication of current operation
- Persists across all views (sticky bottom bar)

#### 4. File Operation Badges (High Priority)
Visual representation of file system changes:

**Badge Format:** "[Action] ~/path/to/file"
- Actions: `Written ✓`, `Updated ✓`, `Running`
- Green checkmarks for completed operations
- Document preview icons
- Expandable with (⋮) icon for full command details
- Hover state reveals download button

**Badge States:**
- Queued: Gray outline
- Running: Blue with spinner
- Completed: Green with checkmark
- Failed: Red with X icon

#### 5. Status Indicators Throughout Execution

**Phase 1: Planning**
- Status: "Planning"
- Status: "Understanding requirements"
- Status: "Weighing the possibilities"

**Phase 2: Execution**
- Real-time tool badges
- File operation badges
- Subtask progression counter
- Terminal output streaming

**Phase 3: Completion**
- Green checkmark in task card
- Summary of all file operations
- Action CTAs (Preview, Deploy)
- Credits used display

#### 6. Color Scheme & Typography
**Colors:**
- Primary: Purple/violet (#7C3AED) for actions and active states
- Success: Green (#10B981) for checkmarks and completions
- Warning/Error: Red for cancellation and errors
- Neutral: Grays for backgrounds (#F3F4F6, #E5E7EB)
- Borders: Light gray (#D1D5DB)

**Typography:**
- Monospace: For code, file paths, terminal output
- Sans-serif: For UI elements and labels
- Clear hierarchy: h3 for task titles, smaller text for metadata

#### 7. Interactive Elements
- Expandable/collapsible command badges
- Inline code editor with syntax highlighting
- Preview modal with device emulation options
- Copy-to-clipboard functionality
- Download on hover for artifacts
- Share/edit buttons on messages

#### 8. Real-time Update Animations
- Smooth transitions for status changes
- Fade-in for new subtasks
- Pulse effect for active operations
- Loading animations (vertical bars for brand consistency)

### Critical Implementation Requirements

#### Must-Have for MVP (Derived from Analysis)
1. **Task Cards** - Visual representation of task status with clear states
2. **Tool Visibility Panel** - Side panel showing active tool usage and output
3. **Progress Counter** - Persistent "Task X, Subtask Y" indicator
4. **File Operation Badges** - Visual tracking of all file system changes
5. **Real-time Status Updates** - Live status transitions without page refresh
6. **Terminal Output Display** - Streaming command execution output
7. **Completion Summary** - List of all operations with download links

#### High Priority (Phase 1+)
8. **Diff Viewer** - Git-style before/after file comparisons
9. **Code Editor Integration** - Syntax-highlighted file viewing
10. **Artifact Management** - Download buttons for generated files
11. **Pause/Cancel Controls** - User control over execution
12. **Feedback Buttons** - Thumbs up/down on completed tasks

#### Nice-to-Have (Phase 2)
13. **Search within Logs** - Filter/search log entries
14. **Export Execution Report** - Download full execution trace
15. **Video Recording** - Replay execution visually

### User Stories & Requirements
- As an authenticated user, I want to see live updates of an agent task run so that I can understand current progress and reasoning.
  - Acceptance:
    - Opening a run page renders a live feed within 1 second.
    - Subtasks visually show status transitions (queued → running → succeeded/failed).
    - Reasoning/tool-call events appear in order with timestamps.

- As a user, I want to expand any subtask to see its detailed logs so that I can inspect what happened.
  - Acceptance:
    - Each subtask node expands to a chronological list of events (reasoning, tool calls, artifacts).
    - Large logs are virtualized/scrollable and searchable.

- As a user, I want to pause or cancel an ongoing run so that I can control costs/time.
  - Acceptance:
    - Pause/Cancel buttons show while status is running.
    - On click, run transitions to paused/canceled within 2 seconds and no further tool calls execute.
    - A toast to confirm the action or show error.

- As a user, I want the live feed to recover from connection drops so that I don’t miss updates.
  - Acceptance:
    - If connection drops, it auto-reconnects within 5 seconds.
    - No duplicated entries; missed events are backfilled using persisted logs and last event id.

- As a user, I want to download artifacts produced by subtasks so that I can use outputs.
  - Acceptance:
    - Artifact links/buttons appear when available and download successfully.

- As a developer, I want all events persisted so that I can replay any run for debugging or audit.
  - Acceptance:
    - Visiting a completed run shows the entire log tree from the database (without a live stream).
    - Stream endpoint supports cursor-based replay.

### Technical Architecture Insights

#### Key Observations from Reference Platform

**1. Real-time Communication Stack**
- Primary: WebSockets for bidirectional, low-latency updates
- Fallback: Server-Sent Events (SSE) for unidirectional streaming
- Heartbeat: Every 20 seconds to maintain connection alive
- Recovery: Auto-reconnect with Last-Event-ID for seamless resumption

**2. Event Sequencing & Ordering**
- Monotonically increasing sequence numbers per run
- Atomic sequence assignment via database (prevents gaps/duplicates)
- Client tracks last received sequence for reconnection
- Server replays missed events from database on reconnect

**3. Performance Optimizations**
- Batch UI updates using requestAnimationFrame
- Virtualized lists for large log displays
- Progressive disclosure: collapsed by default, expand on demand
- Lazy loading of detailed logs and artifacts
- Rate limiting on event publication (prevent flood)

**4. State Management Pattern**
- Server: PostgreSQL as source of truth + Redis Pub/Sub for real-time
- Client: useReducer for event stream state with deduplication
- Optimistic updates for user actions (pause/cancel)
- Revalidation on reconnect to sync state

**5. Scalability Considerations**
- Separate Redis connections for pub and sub (prevents blocking)
- Channel-per-run isolation (`run:{runId}:events`)
- Control channel separate from event channel
- Horizontal scaling: multiple SSE handlers can serve same run via shared Redis

**6. Persistence Strategy**
- All events written to database before broadcasting
- Sequence assigned transactionally with run metadata update
- Logs tail cached in run record for quick preview
- Full log retrieval paginated for large runs

**7. Error Handling & Resilience**
- SSE auto-reconnect built into EventSource API
- Manual backoff for repeated failures
- Graceful degradation: show last known state if stream fails
- Connection status indicator in UI (online/offline/reconnecting)

#### Component Architecture (Recommended)

```tsx
// Hierarchy aligned with Abacus patterns
<RunProgressPanel runId={runId}>
  {/* Top: Task Card with Status */}
  <TaskHeader status={status} title={title} />
  
  {/* Left: Main Content Area */}
  <div className="flex">
    <MainContent>
      <SubtaskTree subtasks={subtasks} />
      <CompletionSummary operations={operations} />
    </MainContent>
    
    {/* Right: Tool Usage Panel (conditionally shown) */}
    {activeToolId && (
      <ToolUsagePanel 
        toolName={currentTool}
        output={toolOutput}
        logs={toolLogs}
      />
    )}
  </div>
  
  {/* Bottom: Status Bar (sticky) */}
  <StatusBar 
    currentTask={currentTask}
    currentSubtask={currentSubtask}
    totalSubtasks={totalSubtasks}
  />
  
  {/* Control Buttons */}
  <ControlButtons
    onPause={handlePause}
    onCancel={handleCancel}
    disabled={!isRunning}
  />
</RunProgressPanel>
```

#### Event Types & Payloads (Enhanced)

Based on reference implementation, expand event types:

```typescript
// Core status events
type StatusUpdateEvent = {
  type: 'status_update';
  runId: string;
  subtaskId?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  statusDetail?: string; // e.g., "Initializing", "Planning"
  timestamp: string;
};

// Tool execution events
type ToolCallStartEvent = {
  type: 'tool_call_start';
  runId: string;
  subtaskId: string;
  toolName: string;
  toolIcon?: string;
  timestamp: string;
};

type ToolCallEndEvent = {
  type: 'tool_call_end';
  runId: string;
  subtaskId: string;
  toolName: string;
  success: boolean;
  output?: any;
  error?: string;
  timestamp: string;
};

// File operation events
type FileOperationEvent = {
  type: 'file_operation';
  runId: string;
  subtaskId: string;
  operation: 'written' | 'updated' | 'deleted' | 'running';
  path: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  downloadUrl?: string; // signed URL for completed files
  diffAvailable?: boolean;
  timestamp: string;
};

// Terminal/stdout events
type StdoutEvent = {
  type: 'stdout';
  runId: string;
  subtaskId: string;
  content: string; // ANSI-formatted text
  timestamp: string;
};

// Progress counter events
type ProgressUpdateEvent = {
  type: 'progress_update';
  runId: string;
  currentTask: number;
  currentSubtask: number;
  totalSubtasks: number;
  message?: string; // e.g., "Installing dependencies..."
  timestamp: string;
};
```

### Technical Implementation

#### Database Schema
```typescript
// /db/schema/progress-stream-schema.ts
import {
  pgTable, uuid, text, timestamp, jsonb, integer, varchar, pgEnum, boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const runStatusEnum = pgEnum('run_status', [
  'queued', 'running', 'paused', 'canceled', 'succeeded', 'failed',
]);

export const eventTypeEnum = pgEnum('event_type', [
  'status_update',        // run/subtask status changes
  'reasoning',            // model chain-of-thought style summary (only if enabled for user; ensure not to leak sensitive raw prompts)
  'tool_call_start',
  'tool_call_end',
  'artifact',
  'stdout',
  'stderr',
  'heartbeat',
  'error',
]);

export const severityEnum = pgEnum('severity', [
  'debug', 'info', 'warn', 'error'
]);

// Core Run (execution) — if a broader "tasks" table exists, reference its id in external integration.
// This feature minimally needs run tracking and ownership.
export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 256 }).notNull(), // Clerk user id
  title: text('title').notNull(),
  status: runStatusEnum('status').notNull().default('queued'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  // Cursor for last persisted sequence to support SSE Last-Event-ID recovery
  lastSequence: integer('last_sequence').notNull().default(0),
  // Optional: external correlation id to another feature (planning/execution engine)
  externalRef: varchar('external_ref', { length: 256 }),
}, (table) => ({
  userIdx: { columns: [table.userId] },
  statusIdx: { columns: [table.status] },
}));

// Hierarchical Subtasks for tree UI
export const runSubtasks = pgTable('run_subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references(() => runSubtasks.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  status: runStatusEnum('status').notNull().default('queued'),
  order: integer('order').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  errorMessage: text('error_message'),
}, (table) => ({
  runIdx: { columns: [table.runId] },
  parentIdx: { columns: [table.parentId] },
  statusIdx: { columns: [table.status] },
}));

// Persisted event log for replay and debug
export const runEvents = pgTable('run_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  subtaskId: uuid('subtask_id').references(() => runSubtasks.id, { onDelete: 'set null' }),
  sequence: integer('sequence').notNull(), // monotonically increasing per run
  type: eventTypeEnum('type').notNull(),
  severity: severityEnum('severity').notNull().default('info'),
  message: text('message'), // short text
  payload: jsonb('payload'), // structured details (tool inputs/outputs summaries, metrics)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  persisted: boolean('persisted').notNull().default(true),
}, (table) => ({
  runSeqIdx: { columns: [table.runId, table.sequence], unique: true },
  runIdx: { columns: [table.runId] },
  subtaskIdx: { columns: [table.subtaskId] },
  typeIdx: { columns: [table.type] },
  createdIdx: { columns: [table.createdAt] },
}));

// Artifact metadata (actual bytes may be stored in Supabase Storage)
export const runArtifacts = pgTable('run_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  subtaskId: uuid('subtask_id').references(() => runSubtasks.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  mimeType: varchar('mime_type', { length: 256 }),
  sizeBytes: integer('size_bytes'),
  storagePath: text('storage_path').notNull(), // e.g., 'runs/{runId}/{artifactId}'
  checksum: varchar('checksum', { length: 128 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  runIdx: { columns: [table.runId] },
  subtaskIdx: { columns: [table.subtaskId] },
}));
```

#### API Endpoints / Server Actions
```typescript
// /lib/redis.ts
import Redis from 'ioredis';
export const redis = new Redis(process.env.REDIS_URL!);
export const redisPub = new Redis(process.env.REDIS_URL!); // separate pub connection
export const channelForRun = (runId: string) => `run:${runId}:events`;
export const controlChannelForRun = (runId: string) => `run:${runId}:control`;
```

```typescript
// /lib/progress/events.ts
import { z } from 'zod';

export const RunEventSchema = z.object({
  runId: z.string().uuid(),
  subtaskId: z.string().uuid().optional(),
  type: z.enum([
    'status_update','reasoning','tool_call_start','tool_call_end','artifact','stdout','stderr','heartbeat','error'
  ]),
  severity: z.enum(['debug','info','warn','error']).default('info'),
  message: z.string().optional(),
  payload: z.any().optional(),
  // optional if publisher does not know; server will assign monotonic sequence
  sequence: z.number().int().positive().optional(),
  createdAt: z.string().datetime().optional(),
});
export type RunEvent = z.infer<typeof RunEventSchema>;
```

```typescript
// /actions/runs/publish-event.ts
'use server';

import { db } from '@/db';
import { runEvents, runs } from '@/db/schema/progress-stream-schema';
import { and, eq, sql } from 'drizzle-orm';
import { redis, redisPub, channelForRun } from '@/lib/redis';
import { auth } from '@clerk/nextjs';
import { RunEventSchema } from '@/lib/progress/events';

export async function publishRunEvent(raw: unknown) {
  // Used by internal execution engine (trusted context) via server action or direct import.
  const evt = RunEventSchema.parse(raw);

  // Assign sequence atomically per run
  const [{ lastSequence }] = await db.update(runs)
    .set({ lastSequence: sql`${runs.lastSequence} + 1` })
    .where(eq(runs.id, evt.runId))
    .returning({ lastSequence: runs.lastSequence });

  const sequence = lastSequence;

  await db.insert(runEvents).values({
    runId: evt.runId,
    subtaskId: evt.subtaskId ?? null,
    sequence,
    type: evt.type,
    severity: evt.severity ?? 'info',
    message: evt.message,
    payload: evt.payload ?? null,
  });

  await redisPub.publish(channelForRun(evt.runId), JSON.stringify({ ...evt, sequence }));

  return { ok: true, sequence };
}
```

```typescript
// /app/api/streams/runs/[runId]/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { runs, runEvents } from '@/db/schema/progress-stream-schema';
import { and, eq, gt } from 'drizzle-orm';
import { redis, channelForRun } from '@/lib/redis';

export const runtime = 'nodejs'; // SSE over Node runtime
export const GET = async (req: NextRequest, { params }: { params: { runId: string } }) => {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const runId = params.runId;
  const [run] = await db.select().from(runs).where(and(eq(runs.id, runId), eq(runs.userId, userId))).limit(1);
  if (!run) return new Response('Not Found', { status: 404 });

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get('since'); // numeric sequence
  const lastEventIdHeader = req.headers.get('last-event-id');
  const since = Number.isFinite(Number(sinceParam)) ? Number(sinceParam) :
                Number.isFinite(Number(lastEventIdHeader)) ? Number(lastEventIdHeader) : 0;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: any) => {
        // SSE frame: id, event, data
        const frame =
          `id: ${data.sequence}\n` +
          `event: ${data.type}\n` +
          `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(frame));
      };

      // Flush initial replay of missed events
      const past = await db
        .select()
        .from(runEvents)
        .where(and(eq(runEvents.runId, runId), gt(runEvents.sequence, since)))
        .orderBy(runEvents.sequence);

      for (const evt of past) {
        send({
          runId,
          subtaskId: evt.subtaskId,
          type: evt.type,
          severity: evt.severity,
          message: evt.message,
          payload: evt.payload,
          sequence: evt.sequence,
          createdAt: evt.createdAt,
        });
      }

      // Heartbeat every 20s to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`));
      }, 20000);

      // Subscribe to Redis Pub/Sub for live events
      const sub = redis.duplicate();
      await sub.subscribe(channelForRun(runId));
      sub.on('message', (_ch, message) => {
        try {
          const data = JSON.parse(message);
          send(data);
        } catch {
          // swallow
        }
      });

      // Close handlers
      const close = async () => {
        clearInterval(heartbeat);
        try { await sub.unsubscribe(channelForRun(runId)); await sub.quit(); } catch {}
        controller.close();
      };

      // When client disconnects
      // @ts-ignore - not typed on web streams
      req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // for proxies
    },
  });
};
```

```typescript
// /actions/runs/control.ts
'use server';

import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { runs } from '@/db/schema/progress-stream-schema';
import { and, eq } from 'drizzle-orm';
import { redisPub, controlChannelForRun } from '@/lib/redis';

export async function pauseRun(runId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const [run] = await db.select().from(runs).where(and(eq(runs.id, runId), eq(runs.userId, userId)));
  if (!run) throw new Error('Not Found');

  if (run.status !== 'running') throw new Error('Run not running');

  await db.update(runs).set({ status: 'paused' }).where(eq(runs.id, runId));
  await redisPub.publish(controlChannelForRun(runId), JSON.stringify({ action: 'pause' }));
  return { ok: true };
}

export async function cancelRun(runId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const [run] = await db.select().from(runs).where(and(eq(runs.id, runId), eq(runs.userId, userId)));
  if (!run) throw new Error('Not Found');

  if (run.status === 'canceled' || run.status === 'failed' || run.status === 'succeeded') {
    return { ok: true }; // idempotent
  }

  await db.update(runs).set({ status: 'canceled' }).where(eq(runs.id, runId));
  await redisPub.publish(controlChannelForRun(runId), JSON.stringify({ action: 'cancel' }));
  return { ok: true };
}
```

#### Components Structure

Based on Abacus.AI reference implementation, organize components by feature:

```
/components/progress/
├── run-progress-panel.tsx            // Main container - orchestrates all child components
├── task-card.tsx                     // Task status card with icon, title, status (CRITICAL)
├── tool-usage-panel.tsx              // Right sidebar showing active tool (CRITICAL)
├── status-bar.tsx                    // Bottom sticky bar with "Task X, Subtask Y" (CRITICAL)
├── file-operation-badge.tsx          // Badge component for file operations (HIGH PRIORITY)
├── run-progress-tree.tsx             // Hierarchical tree of subtasks with expand/collapse
├── subtask-node.tsx                  // Single subtask node row with status badges and counters
├── event-log.tsx                     // Virtualized event list with ANSI color support
├── terminal-output.tsx               // Terminal display with color-coded output
├── artifact-list.tsx                 // Downloadable artifacts with hover download
├── diff-viewer.tsx                   // Git-style diff display for file changes
├── control-buttons.tsx               // Pause/Cancel with disabled states and toasts
├── completion-summary.tsx            // Summary card with all operations and CTAs
└── use-run-stream.ts                 // Client hook to connect to SSE and manage state
```

**Component Prioritization:**
- **P0 (MVP):** task-card, tool-usage-panel, status-bar, file-operation-badge, run-progress-panel
- **P1:** run-progress-tree, subtask-node, event-log, control-buttons
- **P2:** terminal-output, diff-viewer, completion-summary, artifact-list

Key pages:
- /app/runs/[runId]/page.tsx (RSC): fetch initial run and subtasks; renders RunProgressPanel client component.

**ShadCN Components Used:**
- Badge (for status and operation badges)
- Card (for task cards and panels)
- Accordion (for expandable subtasks)
- Progress (for progress bars)
- Button (for controls)
- ScrollArea (for logs and event lists)
- Tooltip (for hover information)
- Separator (for visual divisions)

#### State Management
- Client-side:
  - use-run-stream.ts hook uses EventSource to connect to /api/streams/runs/[runId]?since=<lastSeq>.
  - useReducer to append events, deduplicate by sequence, and update subtask statuses.
  - Local in-memory state for tree expansion and log filters.
- Server-side:
  - Mutations via server actions (pauseRun, cancelRun).
  - Events persisted in Supabase via server action publishRunEvent or direct internal call.
- Reconnection:
  - EventSource auto-reconnect; pass Last-Event-ID; initial fetch from DB handled by endpoint.
  - Maintain lastSequence in client; include in query param on (re)connect.

### Dependencies & Integrations
- Interacts with:
  - Intelligent Task Decomposition & Planning: seeds run_subtasks at start; updates statuses.
  - Multi-LLM Execution: execution engine publishes events via publishRunEvent and listens control channel.
  - Artifacts: artifacts saved to Supabase Storage; metadata stored in run_artifacts.
- External services:
  - Redis (pub/sub) for low-latency streaming and control signaling.
  - Supabase Postgres for persistence; Supabase Storage for artifact bytes.
- NPM packages (beyond standard stack):
  - ioredis (Redis client)
  - bullmq (optional for queued workers if needed by execution engine)
  - zod (if not already present for validation)
  - react-virtual (or @tanstack/react-virtual) for large event logs virtualization

Environment variables:
- REDIS_URL
- NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server-side only where required)

### Implementation Steps
1. Create database schema
   - Add progress-stream-schema.ts and run drizzle generate/migrate.
   - Ensure indexes created as defined.

2. Generate queries
   - Utility functions to fetch runs, subtasks, and events since sequence.
   - Helper to insert artifacts metadata.

3. Implement server actions
   - publishRunEvent to persist and broadcast.
   - pauseRun, cancelRun to update run status and publish control messages.

4. Build streaming endpoint
   - /api/streams/runs/[runId]/route.ts implementing SSE with replay and heartbeat.

5. Build UI components
   - RunProgressPanel: header with run title, status, and ControlButtons.
   - RunProgressTree: renders subtasks; SubtaskNode shows ShadCN Badge, Progress, and motion.
   - EventLog: filters by subtask; supports severity filters and search; virtualized list.
   - ArtifactList: render download links; handle 403/404 gracefully.

6. Connect frontend to backend
   - use-run-stream.ts to open EventSource, send since from last local sequence.
   - Update state on events; optimistic updates for pause/cancel.

7. Add error handling
   - Toasts on action failures; disabled buttons for invalid states.
   - SSE retry logic; rate-limit initial load if needed.

8. Test the feature
   - Unit tests for event serialization, reducer logic.
   - Integration tests for SSE reconnection and replay.
   - UAT scripts per acceptance.

### Edge Cases & Error Handling
- Client disconnects mid-run:
  - SSE auto-reconnect with Last-Event-ID; server replays events > last seen sequence.
- Duplicate or out-of-order events:
  - Sequence numbers enforce order; reducer deduplicates by sequence.
- Large runs with many events:
  - Virtualized lists; batch UI updates; backpressure via requestAnimationFrame.
- Unauthorized access:
  - All endpoints verify Clerk user and run ownership; 401/404 accordingly.
- Pausing/canceling finished runs:
  - Server actions idempotently return ok; no state changes.
- Sensitive reasoning content:
  - Ensure only safe summaries are emitted; optionally gate by user plan via Whop integration.
- Redis downtime:
  - SSE still serves persisted events; liveness degrades to polling if necessary (optional fallback).
- Long-lived connections on Vercel:
  - Heartbeats keep alive; Connection: keep-alive; use Node runtime.

### Testing Approach
- Unit tests
  - Reducer handling of event ordering, deduplication, and subtask status transitions.
  - publishRunEvent assigns sequences monotonically; schema zod parsing.
- Integration tests
  - Stream reconnect: open SSE, emit N events, disconnect, emit M events, reconnect with Last-Event-ID; assert all N+M in order with no dupes.
  - Pause/Cancel: click control buttons; assert DB status change and control message published.
  - Replay-only: when run is completed, endpoint without Redis still returns full log.
- UAT
  - Start a run; see live updates within 1 second.
  - Expand subtasks; logs and artifacts render correctly.
  - Simulate network offline/online; UI recovers and fills gaps.
  - Download artifacts; correct MIME and size; 404 handled with user-facing error.

Additional implementation notes:
- UI/UX
  - Use ShadCN components: Accordion for subtasks, Badge for statuses, Progress for completion, ScrollArea for logs, Tooltip on controls.
  - Framer Motion for subtle expand/collapse and status transitions.
- Security
  - Sanitize message/payload for display; avoid rendering raw HTML.
  - Enforce per-user row-level access in queries.
- Observability
  - Add server-side logging around SSE connections (start/stop) and publish failures.
  - Consider metrics: active connections per run, average events/sec.