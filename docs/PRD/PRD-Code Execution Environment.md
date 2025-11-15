## Feature: Code Execution Environment

### Overview
A secure, isolated runtime to execute user-provided or agent-generated code in Python and Node.js. It uses ephemeral Docker containers with strict CPU/memory/time/network limits, queues execution via Redis to prevent resource exhaustion, and captures stdout/stderr, exit code, artifacts, and audit logs into Supabase. Users and agents can preview code, submit jobs, stream logs in real time, download artifacts, and review execution metadata.

### User Stories & Requirements
- As an authenticated user, I want to run Python or Node.js code in a sandbox so that I can perform custom data transformations or API integrations safely.
  - Acceptance:
    - User selects language, inputs code, optional packages, timeout, and network toggle.
    - Job is queued and later executed with isolation and limits.
    - User can view live logs and final results.
- As an authenticated user, I want to preview the script before execution so that I can confirm what will run.
  - Acceptance:
    - Modal shows the exact code, packages, and runtime constraints.
    - User confirms to submit.
- As an authenticated user, I want to stream stdout/stderr while the job runs so that I can monitor progress.
  - Acceptance:
    - Logs appear in chronological order near-real-time.
    - Includes system messages (e.g., installing packages, timeout warnings).
- As an authenticated user, I want to download files created by my code so that I can use the results elsewhere.
  - Acceptance:
    - Generated files are listed with names, sizes, and download links.
- As an authenticated user, I want to cancel a long-running job so that I can stop undesired executions.
  - Acceptance:
    - Cancel transitions job to cancelled if possible; otherwise ensures container is killed.
- As a platform admin, I want each run logged with resource usage and errors so that I can audit and debug.
  - Acceptance:
    - Supabase stores start/finish timestamps, exit code, timeout reason, OOM, CPU/memory usage when available.
- As a platform, I want to deny network by default and enforce resource limits so that I can ensure security and fair usage.
  - Acceptance:
    - Default network disabled; opt-in via toggle.
    - Memory default 512MB; timeout default 30s; max 5 minutes; CPU throttled.
- As an agent, I want to programmatically submit code runs and receive run IDs and status so that I can orchestrate multi-step workflows.
  - Acceptance:
    - API/server actions to create, poll status, stream logs, and fetch artifacts.
- As a billing system, I want to validate credits before execution so that costs are controlled.
  - Acceptance:
    - Run submission checks available credits and reserves/deducts based on configured policy (placeholder integration).

### Technical Implementation

#### Database Schema
```typescript
// /db/schema/code-exec-schema.ts
import {
  pgTable, uuid, text, jsonb, integer, timestamp, boolean, pgEnum, index
} from 'drizzle-orm/pg-core';

export const codeRunStatusEnum = pgEnum('code_run_status', [
  'queued', 'running', 'succeeded', 'failed', 'cancelled', 'timeout'
]);

export const logStreamEnum = pgEnum('log_stream', ['stdout', 'stderr', 'system']);

export const codeRuns = pgTable('code_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user id
  agentTaskId: uuid('agent_task_id'), // nullable, FK to tasks table if exists
  language: text('language').notNull(), // 'python' | 'node'
  code: text('code').notNull(),
  stdin: text('stdin'),

  packages: jsonb('packages').$type<{
    pip?: string[];
    npm?: string[];
  }>().default({}),

  timeoutSeconds: integer('timeout_seconds').notNull().default(30),
  memoryMb: integer('memory_mb').notNull().default(512),
  cpuShares: integer('cpu_shares').notNull().default(512), // Docker CPU shares
  networkEnabled: boolean('network_enabled').notNull().default(false),

  containerImage: text('container_image'), // resolved at runtime
  status: codeRunStatusEnum('status').notNull().default('queued'),

  queuedAt: timestamp('queued_at', { withTimezone: true }).defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),

  exitCode: integer('exit_code'),
  errorMessage: text('error_message'),

  stdoutExcerpt: text('stdout_excerpt'),
  stderrExcerpt: text('stderr_excerpt'),

  resourceUsage: jsonb('resource_usage').$type<{
    cpuTimeMs?: number;
    maxRssMb?: number;
    bytesIn?: number;
    bytesOut?: number;
    wallTimeMs?: number;
    wasOomKilled?: boolean;
  }>(),

  artifacts: jsonb('artifacts').$type<Array<{
    id: string;
    fileName: string;
    storagePath: string;
    sizeBytes: number;
    contentType?: string;
    sha256?: string;
  }>>().default([]),
}, (t) => ({
  userIdx: index('code_runs_user_idx').on(t.userId),
  statusIdx: index('code_runs_status_idx').on(t.status),
  agentTaskIdx: index('code_runs_agent_task_idx').on(t.agentTaskId),
}));

export const codeRunLogs = pgTable('code_run_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => codeRuns.id, { onDelete: 'cascade' }),
  ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
  stream: logStreamEnum('stream').notNull(), // 'stdout' | 'stderr' | 'system'
  seq: integer('seq').notNull(), // monotonically increasing per run
  message: text('message').notNull(),
}, (t) => ({
  runIdx: index('code_run_logs_run_idx').on(t.runId, t.seq),
}));

export const codeRunArtifacts = pgTable('code_run_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => codeRuns.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  storagePath: text('storage_path').notNull(), // Supabase Storage path
  sizeBytes: integer('size_bytes').notNull(),
  contentType: text('content_type'),
  sha256: text('sha256'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  runIdx: index('code_run_artifacts_run_idx').on(t.runId),
}));
```

#### API Endpoints / Server Actions
```typescript
// /actions/code-exec-actions.ts
'use server';

import { auth } from '@clerk/nextjs';
import { z } from 'zod';
import { db } from '@/db'; // Drizzle instance
import { codeRuns, codeRunLogs, codeRunArtifacts } from '@/db/schema/code-exec-schema';
import { eq, and, desc } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

const REDIS_URL = process.env.REDIS_URL!;
const queue = new Queue('code-exec', { connection: { url: REDIS_URL } });

const createRunInput = z.object({
  language: z.enum(['python', 'node']),
  code: z.string().min(1).max(100_000),
  stdin: z.string().optional(),
  packages: z.object({ pip: z.array(z.string()).optional(), npm: z.array(z.string()).optional() }).partial().optional(),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
  memoryMb: z.number().int().min(128).max(2048).default(512),
  cpuShares: z.number().int().min(128).max(2048).default(512),
  networkEnabled: z.boolean().default(false),
  agentTaskId: z.string().uuid().optional(),
});

export type CreateCodeRunInput = z.infer<typeof createRunInput>;

export async function createCodeRun(input: CreateCodeRunInput) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const data = createRunInput.parse(input);

  // TODO: integrate credit check/reservation
  // await ensureCreditsAvailable(userId, estimateCost(data));

  const [run] = await db.insert(codeRuns).values({
    userId,
    agentTaskId: data.agentTaskId as any,
    language: data.language,
    code: data.code,
    stdin: data.stdin,
    packages: data.packages ?? {},
    timeoutSeconds: data.timeoutSeconds,
    memoryMb: data.memoryMb,
    cpuShares: data.cpuShares,
    networkEnabled: data.networkEnabled,
    status: 'queued',
  }).returning();

  // Enqueue job to Redis
  await queue.add('execute', {
    runId: run.id,
    userId,
  }, {
    removeOnComplete: 1000,
    removeOnFail: 1000,
    attempts: 1,
  });

  return { runId: run.id };
}

export async function cancelCodeRun(runId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const [run] = await db.select().from(codeRuns).where(and(eq(codeRuns.id, runId), eq(codeRuns.userId, userId)));
  if (!run) throw new Error('Not found');

  // Signal cancel via queue (worker listens for this)
  const cancelChannel = `code-exec:cancel:${runId}`;
  // Lightweight publish using ioredis recommended; for brevity use BullMQ queue
  await queue.add('cancel', { runId }, { priority: 1, removeOnComplete: true });

  await db.update(codeRuns).set({ status: 'cancelled', finishedAt: new Date(), errorMessage: 'Cancelled by user' })
    .where(eq(codeRuns.id, runId));

  return { ok: true };
}

export async function getCodeRun(runId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const [run] = await db.select().from(codeRuns).where(and(eq(codeRuns.id, runId), eq(codeRuns.userId, userId)));
  if (!run) throw new Error('Not found');

  return run;
}

export async function listCodeRuns(opts?: { limit?: number; cursor?: string }) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const limit = Math.min(opts?.limit ?? 20, 50);
  const runs = await db.select().from(codeRuns)
    .where(eq(codeRuns.userId, userId))
    .orderBy(desc(codeRuns.queuedAt))
    .limit(limit);

  return runs;
}

export async function getRunLogs(runId: string, afterSeq?: number) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  // Ensure ownership
  const [run] = await db.select({ id: codeRuns.id }).from(codeRuns)
    .where(and(eq(codeRuns.id, runId), eq(codeRuns.userId, userId)));
  if (!run) throw new Error('Not found');

  const logs = await db.select().from(codeRunLogs)
    .where(afterSeq ? and(eq(codeRunLogs.runId, runId), codeRunLogs.seq.gt(afterSeq as any)) : eq(codeRunLogs.runId, runId))
    .orderBy(codeRunLogs.seq);

  return logs;
}

export async function getRunArtifacts(runId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const [run] = await db.select({ id: codeRuns.id }).from(codeRuns)
    .where(and(eq(codeRuns.id, runId), eq(codeRuns.userId, userId)));
  if (!run) throw new Error('Not found');

  const artifacts = await db.select().from(codeRunArtifacts)
    .where(eq(codeRunArtifacts.runId, runId));

  return artifacts;
}
```

Worker outline (separate process):
```typescript
// /worker/executor.ts
import { Worker, QueueEvents, JobsOptions } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const connection = { url: process.env.REDIS_URL! };
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PY_IMAGE = process.env.EXECUTOR_IMAGE_PYTHON ?? 'mindousai/executor-python:1.0';
const NODE_IMAGE = process.env.EXECUTOR_IMAGE_NODE ?? 'mindousai/executor-node:1.0';
const MAX_TIMEOUT = 300;

type RunRow = {
  id: string; user_id: string; language: 'python'|'node'; code: string; stdin?: string|null;
  packages: { pip?: string[]; npm?: string[] }; timeout_seconds: number; memory_mb: number;
  cpu_shares: number; network_enabled: boolean;
};

new Worker('code-exec', async job => {
  if (job.name === 'cancel') {
    // No-op. Cancellation is best-effort via docker kill below when checked.
    return;
  }
  const runId: string = job.data.runId;
  // Fetch run
  const { data: runData } = await supabase.from('code_runs').select('*').eq('id', runId).single();
  const run = runData as unknown as RunRow;

  const workDir = path.join('/tmp', `run-${runId}`);
  await fs.mkdir(workDir, { recursive: true });
  const mainFile = run.language === 'python' ? 'main.py' : 'index.js';
  await fs.writeFile(path.join(workDir, mainFile), run.code, 'utf-8');
  if (run.stdin) await fs.writeFile(path.join(workDir, 'stdin.txt'), run.stdin, 'utf-8');
  await fs.mkdir(path.join(workDir, 'output'), { recursive: true });

  const image = run.language === 'python' ? PY_IMAGE : NODE_IMAGE;
  const installCmd = run.language === 'python'
    ? (run.packages?.pip?.length ? `pip install --no-cache-dir ${run.packages.pip.join(' ')} && ` : '')
    : (run.packages?.npm?.length ? `npm i --no-audit --progress=false ${run.packages.npm.join(' ')} && ` : '');

  const execCmd = run.language === 'python'
    ? `bash -lc "${installCmd}timeout ${Math.min(run.timeout_seconds, MAX_TIMEOUT)}s python /workspace/${mainFile} < /workspace/stdin.txt || true"`
    : `bash -lc "${installCmd}timeout ${Math.min(run.timeout_seconds, MAX_TIMEOUT)}s node /workspace/${mainFile} < /workspace/stdin.txt || true"`;

  // Update started
  await supabase.from('code_runs').update({ status: 'running', started_at: new Date().toISOString(), container_image: image }).eq('id', runId);

  const dockerArgs = [
    'run', '--rm',
    '--name', `run-${runId}`,
    '--memory', `${run.memory_mb}m`,
    '--cpus', (Math.max(0.1, Math.min(2, run.cpu_shares / 1024))).toString(),
    ...(run.network_enabled ? [] : ['--network', 'none']),
    '-v', `${workDir}:/workspace`,
    image, '/bin/sh', '-c', execCmd
  ];

  let seq = 0;
  const appendLog = async (stream: 'stdout'|'stderr'|'system', message: string) => {
    seq += 1;
    await supabase.from('code_run_logs').insert({
      run_id: runId, stream, message: message.slice(0, 8000), seq
    });
  };

  await appendLog('system', `Starting container with image ${image}...`);

  const proc = spawn('docker', dockerArgs, { env: { ...process.env } });
  proc.stdout.setEncoding('utf-8');
  proc.stderr.setEncoding('utf-8');

  proc.stdout.on('data', async (chunk) => { await appendLog('stdout', String(chunk)); });
  proc.stderr.on('data', async (chunk) => { await appendLog('stderr', String(chunk)); });

  const exitCode: number = await new Promise((res) => proc.on('close', res as any));

  // Collect artifacts from /output
  const outDir = path.join(workDir, 'output');
  let artifacts: any[] = [];
  try {
    const files = await fs.readdir(outDir);
    for (const f of files) {
      const p = path.join(outDir, f);
      const buf = await fs.readFile(p);
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
      const storagePath = `runs/${runId}/${f}`;
      const bucket = process.env.SUPABASE_BUCKET_CODE_EXEC ?? 'code-exec-artifacts';
      const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, buf, { upsert: true });
      if (!upErr) {
        artifacts.push({ fileName: f, storagePath, sizeBytes: buf.byteLength, sha256 });
        await supabase.from('code_run_artifacts').insert({
          run_id: runId, file_name: f, storage_path: storagePath, size_bytes: buf.byteLength, sha256
        });
      }
    }
  } catch { /* no artifacts */ }

  const status = exitCode === 0 ? 'succeeded' : (exitCode === 124 ? 'timeout' : 'failed');
  await supabase.from('code_runs').update({
    status,
    finished_at: new Date().toISOString(),
    exit_code: exitCode,
    artifacts,
  }).eq('id', runId);

  await appendLog('system', `Execution finished with status=${status}, exit=${exitCode}`);
}, { connection });
```

Note: Deploy worker on a VM or container platform with access to Docker daemon. For better cancellation, maintain a side-channel to kill containers by name.

SSE streaming route (optional if not using Supabase Realtime):
```typescript
// /app/api/code-exec/stream/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/db';
import { codeRuns, codeRunLogs } from '@/db/schema/code-exec-schema';
import { auth } from '@clerk/nextjs';
import { and, eq, gt, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');
  if (!runId) return new Response('Bad Request', { status: 400 });

  // Ownership check
  const [run] = await db.select({ id: codeRuns.id, userId: codeRuns.userId }).from(codeRuns)
    .where(eq(codeRuns.id, runId));
  if (!run || run.userId !== userId) return new Response('Not found', { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      let lastSeq = 0;
      const send = (data: unknown) => controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      send({ type: 'init', runId });

      const interval = setInterval(async () => {
        const logs = await db.select().from(codeRunLogs)
          .where(and(eq(codeRunLogs.runId, runId), gt(codeRunLogs.seq, lastSeq as any)))
          .orderBy(asc(codeRunLogs.seq))
          .limit(100);
        if (logs.length) {
          lastSeq = logs[logs.length - 1].seq!;
          send({ type: 'logs', logs });
        }
        // stop when run finished
        const [r] = await db.select({ status: codeRuns.status }).from(codeRuns).where(eq(codeRuns.id, runId));
        if (r && ['succeeded', 'failed', 'cancelled', 'timeout'].includes(r.status as any)) {
          clearInterval(interval);
          send({ type: 'done', status: r.status });
          controller.close();
        }
      }, 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

#### Components Structure
```
/components/code-exec/
├── code-exec-panel.tsx          // main UI: form + editor + run/cancel
├── code-preview-modal.tsx       // pre-run confirmation with code and settings
├── logs-viewer.tsx              // real-time logs (SSE or Supabase Realtime)
├── artifacts-list.tsx           // lists and downloads artifacts
├── run-summary-card.tsx         // status, timings, resource usage
└── run-history-table.tsx        // paginated list of past runs
```

Pages:
- /app/(dashboard)/code-exec/page.tsx — renders CodeExecPanel and recent runs
- Optional: /app/(dashboard)/code-exec/[runId]/page.tsx — focused run details

Key notes:
- Use ShadCN components (Dialog, Button, Input, Select, Toggle, Badge, Card, Table, Tabs).
- Use Tailwind for layout.
- Monaco editor for code input.

Example component snippet:
```tsx
// /components/code-exec/code-exec-panel.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { createCodeRun, cancelCodeRun, listCodeRuns } from '@/actions/code-exec-actions';
import { Button, Select, Input, Switch } from '@/components/ui'; // shadcn exports
import { LogsViewer } from './logs-viewer';
import { ArtifactsList } from './artifacts-list';
import { RunSummaryCard } from './run-summary-card';

export function CodeExecPanel() {
  const [language, setLanguage] = useState<'python'|'node'>('python');
  const [code, setCode] = useState<string>('print("Hello Mindous")');
  const [runId, setRunId] = useState<string>();
  const [network, setNetwork] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [memoryMb, setMemoryMb] = useState(512);
  const [packages, setPackages] = useState<{ pip?: string[]; npm?: string[] }>({});

  async function onRun() {
    const res = await createCodeRun({ language, code, timeoutSeconds, memoryMb, networkEnabled: network, packages });
    setRunId(res.runId);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <Select value={language} onValueChange={v => setLanguage(v as any)}>
          <option value="python">Python</option>
          <option value="node">Node.js</option>
        </Select>
        <Input type="number" min={1} max={300} value={timeoutSeconds} onChange={e => setTimeoutSeconds(+e.target.value)} />
        <Input type="number" min={128} max={2048} value={memoryMb} onChange={e => setMemoryMb(+e.target.value)} />
        <div className="flex items-center gap-2">
          <span>Network</span>
          <Switch checked={network} onCheckedChange={setNetwork} />
        </div>
        <Button onClick={onRun}>Run</Button>
        {runId && <Button variant="destructive" onClick={() => cancelCodeRun(runId!)}>Cancel</Button>}
      </div>
      <Editor height="300px" language={language === 'python' ? 'python' : 'javascript'} theme="vs-dark" value={code} onChange={(v) => setCode(v || '')} />
      {runId && (
        <>
          <RunSummaryCard runId={runId} />
          <LogsViewer runId={runId} />
          <ArtifactsList runId={runId} />
        </>
      )}
    </div>
  );
}
```

#### State Management
- Client state: React useState for form inputs and current runId.
- Server state: Stored in Supabase via Drizzle; server actions mutate (create, cancel).
- Real-time logs: Prefer Supabase Realtime on code_run_logs table, filtered by run_id. Fallback to SSE at /api/code-exec/stream or polling.
- SWR or React Query optional for fetching run status; simple polling via useEffect acceptable.

### Dependencies & Integrations
- Integrates with:
  - Authentication: Clerk — enforce ownership on server actions and routes.
  - Credit-Based Usage System: Validate and deduct credits on submission and on completion (TODO hooks).
  - File & Artifact Management System: Uses Supabase Storage bucket code-exec-artifacts.
  - Real-time Progress Streaming: Either via Supabase Realtime or SSE endpoint.
- External Services:
  - Docker runtime on a dedicated worker host.
  - Redis for job queue (BullMQ).
  - Supabase (Postgres + Storage) for data and artifacts.
- Required npm packages (beyond standard stack):
  - bullmq (Redis-backed queue)
  - ioredis (if direct Redis publishing/subscribing is needed)
  - @supabase/supabase-js (worker-side)
  - @monaco-editor/react and monaco-editor (code editor UI)
  - zod (validation; if not already included)
- Deployment:
  - Next.js app on Vercel.
  - Worker service on a VM/container platform (e.g., Fly.io, Render, AWS ECS) with access to Docker and Redis.
  - Redis instance (e.g., Upstash Redis or managed Redis).
- Container images:
  - mindousai/executor-python:1.0 (Python 3.11 + pip + common libs: pandas, numpy, requests)
  - mindousai/executor-node:1.0 (Node 20 + npm + common libs: axios, cheerio)
  - Images must run unprivileged and default to non-root user, limit cap set, and include entry tools (bash, coreutils, timeout).

Environment variables:
- REDIS_URL
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (worker only)
- SUPABASE_BUCKET_CODE_EXEC=code-exec-artifacts
- EXECUTOR_IMAGE_PYTHON, EXECUTOR_IMAGE_NODE
- EXECUTOR_MAX_TIMEOUT=300 (optional)

### Implementation Steps
1. Create database schema
   - Add /db/schema/code-exec-schema.ts.
   - Run Drizzle migrations to create tables.
   - Enable Supabase Realtime on code_run_logs (optional).
   - Create Supabase Storage bucket code-exec-artifacts.
2. Generate queries
   - Export Drizzle models and helper selectors.
   - Add indexes as per schema.
3. Implement server actions
   - /actions/code-exec-actions.ts with createCodeRun, cancelCodeRun, getCodeRun, getRunLogs, getRunArtifacts, listCodeRuns.
   - Integrate Clerk auth checks.
   - TODO hooks for credit checks before and after execution.
4. Build UI components
   - Implement /components/code-exec/* as described, using ShadCN UI and Monaco editor.
   - Build /app/(dashboard)/code-exec/page.tsx to mount CodeExecPanel and run history.
   - Add logs viewer using Supabase Realtime or SSE.
5. Connect frontend to backend
   - Wire form submission to createCodeRun server action.
   - Subscribe to logs via Realtime/SSE after receiving runId.
   - Poll run status every 2s until terminal.
   - Display artifacts when available, fetching signed URLs from Supabase Storage.
6. Add error handling
   - Validate inputs with zod on server actions.
   - Surface run errors, timeouts, OOM messages in UI.
   - Implement graceful fallbacks if Redis or Realtime unavailable.
7. Test the feature
   - Unit tests for actions and validation.
   - Integration tests against a local Docker + Redis to run sample scripts and verify logs/artifacts.
   - Security tests (network disabled, file system isolation).
   - Load tests to verify queue backpressure and limits.

### Edge Cases & Error Handling
- Oversized code payload (>100KB): reject with validation error.
- Excessive logs: chunk logs and truncate per message to 8KB; UI shows truncation notice.
- Package install failures: capture stderr; continue to run if appropriate; mark run failed with error message.
- Timeout reached: container killed; status=timeout; exitCode may be 124; log system message.
- OOM killed: exit code 137; mark wasOomKilled=true in resourceUsage; display helpful UI message to increase memory.
- Network disabled but code attempts to access network: requests fail; stderr shows errors; do not leak host info.
- Redis unavailable: run submission fails gracefully; show actionable error; no DB row or mark as failed with errorMessage.
- Supabase Storage upload failure: continue run; list artifact upload errors in system logs; do not block status update.
- Cancellation requested after completion: no-op; ensure idempotent update.
- Unauthorized access: enforce userId ownership for all reads/writes.
- Worker crash mid-run: job retry disabled; mark run failed via watchdog or leave as running and add cleanup cron to mark stale runs timeout after 2x timeoutSeconds.

### Testing Approach
- Unit tests:
  - Input validation (zod) for createCodeRun.
  - Ownership checks in server actions.
  - Log serialization ordering (seq increments).
- Integration tests:
  - Happy path Python: print to stdout, write file to /workspace/output/result.txt; verify logs, artifacts entry and actual storage.
  - Happy path Node.js: console.log + artifact.
  - Package install path: use npm/pip install small package (e.g., requests/axios) and run import.
  - Timeout scenario: sleep beyond timeout; ensure status=timeout and logs reflect.
  - OOM scenario: allocate > memory; status failed/oom indicated.
  - Network disabled: attempt fetch to external URL; ensure failure.
  - Cancellation: start long sleep, cancel; ensure container is killed and status=cancelled.
- User acceptance tests:
  - Run creation via UI with preview confirmation.
  - Real-time logs displayed within 1-2s.
  - Artifacts downloadable and correct size/hash.
  - History shows latest runs with correct statuses and timestamps.
  - Access control: another user cannot fetch or stream logs for your run.

Additional Notes:
- Deploy worker with a process manager (e.g., PM2) and health checks.
- Use non-root user inside images; drop capabilities; read-only root FS; mount only /workspace.
- Consider outbound egress allowlist if networkEnabled true.
- Consider quotas per user (max concurrency, daily runtime) using Redis rate limits.
- Log structured system events to Supabase for audit (job queued, container start/stop, errors).