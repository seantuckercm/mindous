## Feature: Specialized Tool Ecosystem

### Overview
The Specialized Tool Ecosystem enables agents in Mindous.ai to perform real-world actions such as web search, data analysis, and chart generation. Tools execute in Docker-based sandboxes with strict resource limits and timeouts. The system exposes curated tools to the agent runtime via function-calling (OpenAI/Anthropic compatible), validates outputs against JSON Schemas, stores artifacts (CSVs, charts) in Supabase Storage, and surfaces tool runs and outputs to users.

### Reference Platform Analysis
Based on comprehensive analysis of Abacus.AI's DeepAgent implementation (November 2025), this PRD emphasizes **tool transparency** - users must see which tools are being used, why, and what outputs they produce. This builds trust and enables debugging.

### Tool Visibility Patterns from Reference Implementation

#### 1. Tool Usage Panel (Critical Feature)

**Right-Side Panel Design:**
Opens automatically when agent begins using a tool, providing real-time visibility.

**Header Structure:**
```
┌─────────────────────────────────────────┐
│ Task 1: [task name] > [current subtask] │
│ 🔧 DeepAgent is using [Tool Name]       │
└─────────────────────────────────────────┘
```

**Key Features:**
- Panel slides in from right side
- Clear badge: "DeepAgent is using [Tool Name]"
- Contextual breadcrumb: Task → Subtask hierarchy
- Closes automatically when tool completes (or stays for review)

#### 2. Tool-Specific Output Display

Different tools require different output visualizations:

**Web Search Tool:**
- Image grid layout for visual results
- Each result shows: thumbnail, title, source URL
- Clickable cards to view full result
- Number of results displayed prominently

**Terminal/Command Execution:**
- Monospace font with ANSI color preservation
- Real-time streaming output (appears as tool runs)
- Syntax highlighting for code output
- Expandable/collapsible sections for long output

**Code Editor/File Operations:**
- Syntax-highlighted code display
- Line numbers on left
- File path shown at top
- Diff view for modifications (git-style)

**Data Analysis/Charts:**
- Embedded visualizations (PNG/SVG)
- Download button for artifacts
- Data summary tables
- Interactive previews when possible

#### 3. Tool Execution Status Badges

**Badge Progression:**
```
Queued → Running → Succeeded/Failed
[Gray]   [Blue]    [Green/Red]
```

**Badge Content:**
- Tool icon (🔍 search, 💻 terminal, 📊 chart, etc.)
- Tool name
- Execution time (optional)
- Status indicator (spinner, checkmark, X)

**Example Badge:**
```
┌──────────────────────────┐
│ 🔍 Web Search            │
│ Status: Running...       │
│ Duration: 2.3s           │
└──────────────────────────┘
```

#### 4. Tool Output Logging

**Log Stream Format:**
```
[12:34:56] Tool: web_search
[12:34:56] Input: {"query": "Next.js best practices"}
[12:34:57] Status: Fetching results...
[12:34:58] Status: Processing 10 results
[12:34:59] ✓ Complete: Found 8 relevant results
[12:34:59] Output: [results array]
```

**Key Elements:**
- Timestamp for each log entry
- Structured input/output display
- Status updates during execution
- Clear success/failure indicators
- Expandable for full output details

#### 5. Artifact Management UI

**Artifact Display:**
- List view of all generated artifacts
- Each shows: filename, type, size, timestamp
- Preview button (for images, text, JSON)
- Download button (with signed URL)
- Delete button (if applicable)

**Example Artifact Card:**
```
┌────────────────────────────────────┐
│ 📄 analysis_results.csv            │
│ Type: text/csv | Size: 45.2 KB     │
│ Created: 2 minutes ago             │
│ [👁️ Preview] [⬇️ Download]         │
└────────────────────────────────────┘
```

#### 6. Multi-Tool Coordination Display

When multiple tools are used in sequence:

**Timeline View:**
```
1. 🔍 Web Search (completed) - 2.3s
   ↓ Found 8 results
2. 📊 Data Analysis (completed) - 5.1s
   ↓ Processed 100 rows
3. 📈 Chart Generation (running) - 3.2s...
   Creating visualization...
```

**Key Features:**
- Vertical timeline showing tool execution order
- Arrows indicating data flow between tools
- Duration for each tool
- Output summary for context
- Current tool highlighted

#### 7. Error Handling & Display

**Error Badge:**
```
┌──────────────────────────────────┐
│ ❌ Web Search                     │
│ Status: Failed                   │
│ Error: API rate limit exceeded   │
│ [Retry] [View Logs]              │
└──────────────────────────────────┘
```

**Error Details:**
- Clear error message (user-friendly)
- Technical details in expandable section
- Retry button for transient failures
- Link to logs for debugging
- Suggested actions when available

### Critical Implementation Requirements

#### Must-Have for MVP
1. **Tool Usage Panel** - Right-side panel showing active tool
2. **Tool Execution Badges** - Visual indicators of tool status
3. **Basic Output Display** - Show tool outputs inline
4. **Artifact List** - Display generated files with download
5. **Error Display** - Clear error messages for tool failures

#### High Priority
6. **Tool-Specific Renderers** - Custom display for different tool types
7. **Log Streaming** - Real-time tool execution logs
8. **Timeline View** - Sequential tool execution visualization
9. **Preview Functionality** - In-browser preview for artifacts

#### Nice-to-Have
10. **Interactive Charts** - Interactive visualizations
11. **Tool History** - Track tool usage across runs
12. **Tool Analytics** - Usage statistics and performance metrics

### User Stories & Requirements
- As a workspace user, I want the agent to use pre-approved tools during task execution so that it can fetch data, analyze it, and produce artifacts safely.
  - Acceptance:
    - Only tools marked active are callable.
    - Each tool runs with defined CPU/memory/time/network limits in sandboxed Docker containers.
    - Tool output must validate against the tool’s output schema; invalid outputs fail the run with an error logged.

- As a workspace user, I want to see which tools were used for my agent run and inspect outputs and artifacts so that I can trust and reuse results.
  - Acceptance:
    - Tool run list is visible per agent run, with status (queued, running, succeeded, failed, timed_out, canceled).
    - Logs stream in real-time during execution.
    - Artifacts (e.g., CSV, PNG) are downloadable via signed URLs.

- As a system admin, I want to track tool usage for analytics so that I can monitor costs and performance.
  - Acceptance:
    - Each tool run records tool_id, duration, success/failure, error, and resource usage metrics (when available).
    - Usage is queryable by date range and tool.

- As an agent orchestrator (internal system), I want to map tools to LLM function-calling schemas so that the LLM can choose and invoke tools autonomously.
  - Acceptance:
    - A function-call adapter provides list of functions with JSON Schema params.
    - Tool invocation emits a ToolRun record and returns when result is available or errors out.
    - Agent receives validated result payloads only.

### Technical Implementation

#### Database Schema
Provide minimal normalized tables: tools, tool_runs, tool_run_events (logs), tool_artifacts, plus enums. All tables scoped by workspace and secured via RLS. Note: assume a workspaces table and agent_runs table already exist.

```typescript
// /db/schema/tools.ts
import {
  pgTable, uuid, text, jsonb, timestamp, integer, boolean, pgEnum, index, numeric
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const toolRunStatusEnum = pgEnum('tool_run_status', [
  'queued', 'running', 'succeeded', 'failed', 'timed_out', 'canceled'
]);

export const tools = pgTable('tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  key: text('key').notNull(), // unique per workspace (e.g., "web_search")
  name: text('name').notNull(),
  version: text('version').notNull().default('1.0.0'),
  description: text('description'),
  // JSON manifest: inputSchema, outputSchema, resources, container specs, permissions
  manifest: jsonb('manifest').notNull(),
  active: boolean('active').notNull().default(true),
  // Docker container image reference and optional tag
  containerImage: text('container_image').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  workspaceIdx: index('tools_workspace_idx').on(t.workspaceId),
  uniqueKey: index('tools_workspace_key_idx').on(t.workspaceId, t.key),
}));

export const toolRuns = pgTable('tool_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  agentRunId: uuid('agent_run_id').notNull(), // links to agent_runs.id
  toolId: uuid('tool_id').notNull(),
  requestedByUserId: text('requested_by_user_id'), // Clerk user id
  status: toolRunStatusEnum('status').notNull().default('queued'),
  inputPayload: jsonb('input_payload').notNull(),
  outputPayload: jsonb('output_payload'),
  error: text('error'),
  logsTail: text('logs_tail'), // optional last N KB for quick preview
  // resource usage/metadata
  cpuSeconds: numeric('cpu_seconds'),
  memoryMb: integer('memory_mb'),
  exitCode: integer('exit_code'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  workspaceIdx: index('tool_runs_workspace_idx').on(t.workspaceId),
  agentIdx: index('tool_runs_agent_idx').on(t.agentRunId),
  toolIdx: index('tool_runs_tool_idx').on(t.toolId),
}));

export const toolRunEvents = pgTable('tool_run_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolRunId: uuid('tool_run_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  ts: timestamp('ts', { withTimezone: true }).defaultNow(),
  level: text('level').notNull().default('info'), // info|warn|error|debug
  message: text('message').notNull(),
  data: jsonb('data'),
}, (t) => ({
  runIdx: index('tool_run_events_run_idx').on(t.toolRunId),
}));

export const toolArtifacts = pgTable('tool_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolRunId: uuid('tool_run_id').notNull(),
  workspaceId: uuid('workspace_id').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  // Supabase Storage path (e.g., "tool-artifacts/{workspaceId}/{runId}/{filename}")
  storagePath: text('storage_path').notNull(),
  checksum: text('checksum'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  runIdx: index('tool_artifacts_run_idx').on(t.toolRunId),
}));

export const toolsRelations = relations(tools, ({ many }) => ({
  runs: many(toolRuns),
}));

export const toolRunsRelations = relations(toolRuns, ({ many }) => ({
  events: many(toolRunEvents),
  artifacts: many(toolArtifacts),
}));

// Suggested RLS (implement via SQL migrations, not Drizzle API):
// - SELECT/INSERT/UPDATE limited to workspace members.
// - INSERT tool_runs allowed by server (service role) and agent orchestrator.
// - Storage bucket "tool-artifacts" with signed URL downloads only.
```

Tool manifest shape (stored in tools.manifest):

```typescript
// Reference type used at runtime (not persisted as TS)
export type ToolManifest = {
  key: string;
  version: string;
  description?: string;
  inputSchema: Record<string, any>;  // JSON Schema v7
  outputSchema: Record<string, any>; // JSON Schema v7
  resources: {
    cpuShares?: number; // Docker --cpu-shares
    memMb?: number;     // Docker -m
    timeoutSec: number;
    diskQuotaMb?: number;
  };
  container: {
    image: string;
    cmd: string[];      // entrypoint command
    argsTemplate: string[]; // tokenized template referencing input keys
    envVars?: string[]; // allowed env vars passed from server secret store
  };
  permissions?: {
    network: {
      enabled: boolean;
      allowedDomains?: string[];
    };
    filesystem: {
      tempDirMb?: number;
    }
  };
};
```

#### API Endpoints / Server Actions
Server actions run on Next.js server, integrate with Supabase and the Tool Runner worker via DB state transitions. All actions must verify Clerk session and workspace membership, and optionally enforce subscription via Whop.

```typescript
// /actions/tools/list-tools.ts
'use server';
import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { tools } from '@/db/schema/tools';
import { eq, and } from 'drizzle-orm';

export async function listTools(workspaceId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  // TODO: verify user belongs to workspaceId
  return db.select().from(tools).where(and(eq(tools.workspaceId, workspaceId), eq(tools.active, true)));
}
```

```typescript
// /actions/tools/invoke-tool.ts
'use server';
import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { tools, toolRuns } from '@/db/schema/tools';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

export async function invokeTool(params: {
  workspaceId: string;
  agentRunId: string;
  toolKey: string;
  input: any;
}) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  // TODO: verify user belongs to workspaceId and agentRunId

  const [tool] = await db.select().from(tools)
    .where(and(eq(tools.workspaceId, params.workspaceId), eq(tools.key, params.toolKey), eq(tools.active, true)));

  if (!tool) throw new Error('Tool not found or inactive');

  // Validate input against manifest.inputSchema
  const validate = ajv.compile(tool.manifest.inputSchema);
  const valid = validate(params.input);
  if (!valid) {
    throw new Error(`Invalid tool input: ${ajv.errorsText(validate.errors)}`);
  }

  const [run] = await db.insert(toolRuns).values({
    workspaceId: params.workspaceId,
    agentRunId: params.agentRunId,
    toolId: tool.id,
    requestedByUserId: userId,
    status: 'queued',
    inputPayload: params.input,
  }).returning();

  // The Tool Runner will pick this up and execute it
  return run;
}
```

```typescript
// /actions/tools/get-tool-run.ts
'use server';
import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { toolRuns, toolArtifacts, toolRunEvents } from '@/db/schema/tools';
import { eq } from 'drizzle-orm';

export async function getToolRun(runId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  // TODO: workspace membership check

  const [run] = await db.select().from(toolRuns).where(eq(toolRuns.id, runId));
  if (!run) throw new Error('Not found');

  const artifacts = await db.select().from(toolArtifacts).where(eq(toolArtifacts.toolRunId, runId));
  const events = await db.select().from(toolRunEvents).where(eq(toolRunEvents.toolRunId, runId));
  return { run, artifacts, events };
}
```

```typescript
// /actions/tools/stream-tool-run-events.ts
// Use Supabase Realtime to subscribe client-side; server action not required.
// Client subscribes to channel: `tool-run-events:{runId}` (configure in worker)
```

```typescript
// /actions/tools/sign-artifact-url.ts
'use server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/db';
import { toolArtifacts } from '@/db/schema/tools';
import { eq } from 'drizzle-orm';

export async function signArtifactUrl(artifactId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  // TODO: workspace membership check

  const [artifact] = await db.select().from(toolArtifacts).where(eq(toolArtifacts.id, artifactId));
  if (!artifact) throw new Error('Not found');

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.storage.from('tool-artifacts').createSignedUrl(artifact.storagePath, 60);
  if (error) throw new Error(error.message);
  return { url: data.signedUrl };
}
```

Tool function-calling adapter to expose tools to LLMs:

```typescript
// /lib/tools/function-call-adapter.ts
import { db } from '@/db';
import { tools } from '@/db/schema/tools';
import { and, eq } from 'drizzle-orm';

export async function getLLMFunctionSpecs(workspaceId: string) {
  const rows = await db.select().from(tools).where(and(eq(tools.workspaceId, workspaceId), eq(tools.active, true)));
  return rows.map((t) => ({
    name: t.key,
    description: t.description ?? t.name,
    parameters: t.manifest.inputSchema, // OpenAI/Anthropic compatible JSON schema
  }));
}

// Handles an LLM tool call result by enqueuing a run:
export async function handleLLMToolCall(args: {
  workspaceId: string; agentRunId: string; toolName: string; toolArgs: any;
}) {
  // internally call invokeTool server action
}
```

Tool Runner Worker (external process) API outline (Node.js service, not a Next.js route):

```typescript
// /workers/tool-runner/index.ts
// Runs as a long-lived process on a VM/container with Docker access
import Docker from 'dockerode';
import Ajv from 'ajv';
import { drizzleDb } from './db'; // service DB connection
import { tools, toolRuns, toolRunEvents, toolArtifacts } from '@/db/schema/tools';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';

const docker = new Docker();
const ajv = new Ajv({ allErrors: true, strict: false });
const supabase = createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function pollAndRun() {
  // 1. Fetch next queued run
  // 2. Lock it (set status=running, startedAt=now) with UPDATE ... WHERE status='queued'
  // 3. Lookup tool + manifest
  // 4. Prepare container with limits and env
  // 5. Stream logs to tool_run_events; keep a tail in tool_runs.logsTail
  // 6. On completion, collect output.json and artifacts/*, validate, upload to Supabase storage
  // 7. Update tool_runs with status and outputPayload
}

setInterval(pollAndRun, 1500);
```

Notes:
- The worker writes events to tool_run_events and can also broadcast to a Realtime channel (via Supabase Realtime) if configured.

#### Components Structure
UI components to browse and inspect tool runs within an agent run page.

```
/components/tools/
├── tool-usage-panel.tsx          // shows tools used in an agent run
├── tool-run-item.tsx             // single run card with status, logs, outputs
├── tool-artifacts-list.tsx       // artifact list with download buttons
├── tool-run-logs.tsx             // realtime log viewer (Supabase Realtime)
└── tool-invoke-button.tsx        // for manual test invocation (admins)
```

- Pages:
  - /app/(dashboard)/workspaces/[wsId]/agent-runs/[runId]/tools/page.tsx — uses ToolUsagePanel.

#### State Management
- Server state via Server Actions and Supabase (DB as source of truth).
- Client components subscribe to Supabase Realtime for tool_run_events per run to stream logs and status changes.
- Minimal React local state for UI controls (expanded logs, filter).

### Dependencies & Integrations
- Interacts with:
  - Agent Orchestrator (function-calling integration) to enqueue tool runs.
  - Real-time Progress Streaming (consumes events to display logs and status).
- External/Additional packages:
  - dockerode (Tool Runner) for Docker control.
  - ajv for JSON Schema validation.
  - puppeteer-core (inside tool containers requiring headless browser).
  - Search provider SDK (e.g., tavily, serpapi) used inside web_search tool container.
- Supabase Storage bucket: tool-artifacts (private).
- Deployment:
  - Next.js app on Vercel.
  - Tool Runner worker runs on a container/VM with Docker (e.g., Fly.io/Railway/EC2). It needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to update DB/storage.

### Implementation Steps
1. Create database schema
   - Add tools, tool_runs, tool_run_events, tool_artifacts tables and enums.
   - Implement RLS policies: restrict access to workspace members.
   - Create storage bucket tool-artifacts (private).

2. Seed tool definitions
   - Create initial tools:
     - web_search: input { query: string, max_results?: number }, output { results: Array<{title,url,snippet}> }.
     - data_analysis: input { csvUrl: string, operation: 'describe'|'filter'|'aggregate', params: object }, output { summary: object, rows?: any[] }.
     - charting: input { spec: VegaLiteSpec | Matplotlib DSL, data: object }, output { imageUrl: string }.
   - Insert corresponding manifests with resource/time limits and container images.

3. Implement server actions
   - listTools, invokeTool, getToolRun, signArtifactUrl.
   - getLLMFunctionSpecs and handleLLMToolCall for agent integration.
   - Validate inputs with ajv before enqueuing.

4. Build UI components
   - ToolUsagePanel: list runs for an agentRunId; shows status badges; fetch via server action.
   - ToolRunItem: details panel with output JSON viewer, error, and artifacts list.
   - ToolRunLogs: subscribes to Supabase Realtime channel tool-run-events:{runId}.
   - ToolArtifactsList: uses signArtifactUrl to download.

5. Build Tool Runner service
   - Implement polling/locking logic.
   - Start container with resource limits (mem, CPU shares), network policy (optional: pass allowed domains env to container; enforce via container network or tool code).
   - Stream stdout/stderr to DB events (throttle/batch).
   - Enforce timeout via Docker stop/kill after manifest.resources.timeoutSec.
   - Collect output.json and artifacts/* from container’s working dir.
   - Upload artifacts to Supabase Storage, store metadata in tool_artifacts.
   - Validate output.json against manifest.outputSchema (ajv). On failure, mark run failed with error.
   - Update toolRuns with status, timings, resource usage.

6. Add validation and error handling
   - Schema validation pre- and post-run.
   - Size limits for artifacts (e.g., 20MB); reject larger.
   - Sanitize logs (strip secrets, ANSI).
   - Defensive checks on tool container exit codes and missing output files.

7. Test the feature
   - Unit tests for manifest validators and server actions.
   - Integration tests using a mock tool container that echoes inputs and writes output.json.
   - E2E flow: from agent tool-call to UI visibility and artifact download.

### Edge Cases & Error Handling
- Invalid tool input: Reject at invokeTool with ajv errors.
- Tool not active or not found: 404-like error.
- Docker container fails to start: Mark run failed, log reason.
- Timeout exceeded: Kill container, mark run timed_out.
- Output missing or invalid JSON: Mark failed with validation error.
- Artifact upload fails: Retry with backoff; on final failure, mark failed and include partial success note.
- Storage path collisions: Use UUID-based paths per run; include checksum verification.
- Log flood/large logs: Truncate events, maintain logsTail; batch inserts to tool_run_events.
- Duplicate runs or double processing: Use transactional state change (queued -> running) with WHERE clause to lock; ensure idempotency in worker.
- Network egress restrictions: If tool requires network but permissions.network.enabled=false, fail fast with clear message.
- Security: Ensure only whitelisted env vars are passed to container; never inject service role keys into tool env. Tools call external APIs using tool-specific tokens mounted via Docker secrets or env proxies.

### Testing Approach
- Unit tests:
  - ajv validation for sample manifests (input/output).
  - Server actions permission checks (workspace membership, subscription status).
  - Function-call adapter generates correct schemas.

- Integration tests:
  - Spin up a local Docker mock tool image that writes a fixed output.json and artifact; verify Tool Runner picks it, validates, uploads, and updates DB.
  - Failure scenarios: invalid output, exit non-zero, timeout, oversized artifact.
  - Realtime: publish several tool_run_events and verify client subscription renders.

- User acceptance tests:
  - Agent run triggers web_search with query; UI shows queued -> running -> succeeded; outputs listed; artifacts downloadable.
  - Data analysis tool processes CSV from Supabase storage and returns summary with chart generated by charting tool; artifacts visible.
  - Admin can view tool usage across date ranges (out of scope for UI here, but ensure data is present).

Additional Implementation Details

Example Tool Manifests (seed data):

```typescript
// /scripts/seed-tools.ts (outline)
const webSearchManifest = {
  key: 'web_search',
  version: '1.0.0',
  description: 'Search the web and return top results',
  inputSchema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string', minLength: 2 },
      max_results: { type: 'integer', minimum: 1, maximum: 10, default: 5 }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: { type: 'object', properties: {
          title: { type: 'string' }, url: { type: 'string', format: 'uri' }, snippet: { type: 'string' }
        }, required: ['title','url'] }
      }
    },
    required: ['results']
  },
  resources: { timeoutSec: 45, memMb: 512, cpuShares: 256 },
  container: {
    image: 'mindous/tool-web-search:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json'],
    envVars: ['TAVILY_API_KEY']
  },
  permissions: { network: { enabled: true, allowedDomains: ['api.tavily.com'] }, filesystem: { tempDirMb: 256 } }
};

const dataAnalysisManifest = {
  key: 'data_analysis',
  version: '1.0.0',
  description: 'Analyze CSV data and return summary',
  inputSchema: {
    type: 'object',
    required: ['csvUrl', 'operation'],
    properties: {
      csvUrl: { type: 'string', format: 'uri' },
      operation: { type: 'string', enum: ['describe', 'filter', 'aggregate'] },
      params: { type: 'object', additionalProperties: true }
    }
  },
  outputSchema: {
    type: 'object',
    properties: { summary: { type: 'object' }, rows: { type: 'array' } },
    required: ['summary']
  },
  resources: { timeoutSec: 90, memMb: 1024, cpuShares: 512 },
  container: {
    image: 'mindous/tool-data-analysis:1.0.0',
    cmd: ['python', 'main.py'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json', '--artifacts', '/work/artifacts'],
  },
  permissions: { network: { enabled: true }, filesystem: { tempDirMb: 1024 } }
};

const chartingManifest = {
  key: 'charting',
  version: '1.0.0',
  description: 'Generate charts from data and spec',
  inputSchema: {
    type: 'object',
    required: ['spec', 'data'],
    properties: { spec: { type: 'object' }, data: { type: 'object' } }
  },
  outputSchema: {
    type: 'object',
    required: ['image'],
    properties: {
      image: { type: 'object', required: ['filename', 'contentType'], properties: {
        filename: { type: 'string' }, contentType: { type: 'string' }
      } }
    }
  },
  resources: { timeoutSec: 60, memMb: 768, cpuShares: 384 },
  container: {
    image: 'mindous/tool-charting:1.0.0',
    cmd: ['node', 'render.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json', '--artifacts', '/work/artifacts']
  },
  permissions: { network: { enabled: false }, filesystem: { tempDirMb: 512 } }
};
```

Worker Container Execution Outline:

```typescript
// /workers/tool-runner/runner.ts (snippet)
import path from 'path';

async function executeRun(runId: string) {
  // fetch run, tool, manifest
  // write input.json to temp dir, create artifacts dir
  // docker.createContainer({ Image, Cmd, HostConfig: { Memory, CpuShares, NetworkMode }, Binds: [tempDir:/work] })
  // container.start()
  // attach to logs; on data -> insert tool_run_events (batch every 500ms)
  // wait for completion with timeout; on timeout -> stop/kill
  // read /work/output.json; validate against manifest.outputSchema
  // upload /work/artifacts/* to supabase storage bucket
  // update toolRuns with outputPayload, status, timestamps, metrics
}
```

UI Usage Example:

```tsx
// /components/tools/tool-usage-panel.tsx
'use client';
import { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@/components/ui'; // shadcn wrappers
import { getToolRun } from '@/actions/tools/get-tool-run';
import { createClient } from '@supabase/supabase-js';

export function ToolUsagePanel({ runId }: { runId: string }) {
  // fetch list runs for agentRunId (create a server action listToolRunsByAgent if needed)
  // subscribe to realtime events for each run to update statuses/logs
  return <div>{/* render ToolRunItem for each */}</div>;
}
```

Security and Policies
- Execution isolation: Docker per run with resource limits; no host mounts except a temp working dir.
- Secrets handling: Only pass env vars listed in manifest.envVars; the worker resolves them from its own environment/secret store.
- Network controls: Enforce via container network (optional) and code-level domain allowlist.
- RLS: Ensure rows are scoped by workspaceId; server actions verify user membership; worker uses service role but writes only to known rows.

Observability
- tool_run_events stores structured logs; consider tagging events (phase: 'start'|'stdout'|'stderr'|'end').
- Add minimal metrics to runs (duration, exitCode, cpuSeconds if available).
- Integrate with app logging (e.g., Vercel logs) from server actions.

Performance Considerations
- Avoid frequent DB writes for logs by batching and truncating.
- Use LISTEN/NOTIFY or polling with backoff in the worker; start with polling every 1.5s.
- Keep artifact sizes capped; compress JSON if large.

Rollback Plan
- Tools are versioned; keep multiple versions in DB, only latest active.
- Worker compatible with multiple manifest versions (backwards compatible fields).

Open Questions (to align before build)
- Which search API provider to standardize on initially (Tavily vs SerpAPI)?
- Hosting for the Tool Runner (e.g., Fly.io) and secret management.
- Organization-level limits: max concurrent runs per workspace.

This PRD provides the schema, server actions, worker outline, and UI components necessary to implement the Specialized Tool Ecosystem feature with sandboxed Docker execution, validation, and user-visible outputs and artifacts.