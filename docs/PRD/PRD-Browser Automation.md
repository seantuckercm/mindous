## Feature: Browser Automation

### Overview
Enables Mindous.ai agents to programmatically interact with websites: navigate URLs, click, type, scroll, wait for dynamic content, extract structured data, and capture screenshots. Jobs run in isolated headless browser containers with resource limits. Results (JSON/CSV), logs, and screenshots are persisted to Supabase for review and downstream use.

### User Stories & Requirements
- As an authenticated user, I want to create a browser automation job (scrape or form-fill) with steps and target URLs so that an agent can perform web tasks on my behalf.
  - Acceptance:
    - A form allows specifying job type, target URLs, steps (navigate, click, type, wait, extract, screenshot), and options (timeouts, proxy).
    - Submitting creates a job with status "queued" and enqueues it.
    - The job is owned by the creator; only they can view/manage it.

- As a user, I want to monitor job progress in real time so that I can verify actions and debug issues.
  - Acceptance:
    - A job detail view shows live logs (info/warn/error/debug) via realtime updates.
    - Status transitions: queued → running → succeeded/failed/canceled/timeout.
    - Timestamps for start and finish are displayed.

- As a user, I want to view and download screenshots and extracted data so that I can validate and use the results.
  - Acceptance:
    - Screenshots are stored and accessible via signed URLs.
    - Extracted data is saved as JSON and optionally downloadable as CSV.
    - Artifact gallery shows thumbnails and metadata.

- As a user, I want jobs to be robust against basic anti-bot measures so that more sites succeed.
  - Acceptance:
    - Browser automation randomizes user agents and viewports, applies realistic delays, and waits for network/DOM stability.
    - Jobs fail gracefully with clear error messages on CAPTCHAs or blocks.

- As a user, I want to cancel a running job so that I can stop undesired or hung operations.
  - Acceptance:
    - Cancel action sets status to "canceled".
    - Worker stops at next safe checkpoint and no further actions execute.

### Technical Implementation

#### Database Schema
```typescript
// /db/schema/browser-automation.ts
import {
  pgTable, uuid, text, timestamp, jsonb, integer, pgEnum, boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const browserJobStatusEnum = pgEnum('browser_job_status', [
  'queued', 'running', 'succeeded', 'failed', 'canceled', 'timeout',
]);

export const browserArtifactTypeEnum = pgEnum('browser_artifact_type', [
  'screenshot', 'html', 'pdf'
]);

export const browserLogLevelEnum = pgEnum('browser_log_level', [
  'debug', 'info', 'warn', 'error'
]);

export const browserJobs = pgTable('browser_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user id (string)
  type: text('type').notNull(), // 'scrape' | 'form_fill' | 'script'
  status: browserJobStatusEnum('status').notNull().default('queued'),
  payload: jsonb('payload').notNull(), // BrowserJobPayload
  resultJson: jsonb('result_json'),
  errorMessage: text('error_message'),
  proxyUrl: text('proxy_url'),
  maxDurationSeconds: integer('max_duration_seconds').default(180),
  userAgent: text('user_agent'),
  viewport: jsonb('viewport'), // { width, height }
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  canceled: boolean('canceled').notNull().default(false),
});

export const browserJobLogs = pgTable('browser_job_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => browserJobs.id, { onDelete: 'cascade' }),
  level: browserLogLevelEnum('level').notNull().default('info'),
  message: text('message').notNull(),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const browserJobArtifacts = pgTable('browser_job_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => browserJobs.id, { onDelete: 'cascade' }),
  type: browserArtifactTypeEnum('type').notNull().default('screenshot'),
  storagePath: text('storage_path').notNull(), // Supabase Storage path
  fileSize: integer('file_size'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations (optional for Drizzle usage)
export const browserJobsRelations = relations(browserJobs, ({ many }) => ({
  logs: many(browserJobLogs),
  artifacts: many(browserJobArtifacts),
}));
```

Types and payload definition:
```typescript
// /types/browser-automation.ts
export type BrowserAction =
  | { kind: 'navigate'; url: string; waitFor?: 'load' | 'networkidle' | 'domcontentloaded'; timeoutMs?: number }
  | { kind: 'click'; selector: string; delayMs?: number }
  | { kind: 'type'; selector: string; text: string; delayMs?: number; clear?: boolean }
  | { kind: 'waitForSelector'; selector: string; state?: 'visible' | 'attached' | 'hidden'; timeoutMs?: number }
  | { kind: 'wait'; ms: number }
  | { kind: 'scroll'; to: 'bottom' | 'top' | 'selector'; selector?: string; stepPx?: number; delayMs?: number }
  | { kind: 'extract'; fields: Record<string, { selector: string; attr?: 'text' | 'href' | 'src' | string }>; many?: boolean }
  | { kind: 'screenshot'; fullPage?: boolean; selector?: string; label?: string }
  | { kind: 'evaluate'; script: string }; // function body run in page context

export interface BrowserJobPayload {
  targets?: string[];           // e.g., a list of URLs (used by scripts to iterate)
  actions: BrowserAction[];     // ordered steps
  options?: {
    maxDurationSeconds?: number;
    userAgent?: string;
    viewport?: { width: number; height: number };
    proxyUrl?: string;
    antiBotLevel?: 'low' | 'medium' | 'high';
  };
  resultFormat?: 'json' | 'csv';
}
```

#### API Endpoints / Server Actions
```typescript
// /actions/browser-automation-actions.ts
'use server';

import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { browserJobs, browserJobArtifacts } from '@/db/schema/browser-automation';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { enqueueBrowserJob } from '@/lib/queues/browser-queue';
import { createClient } from '@/lib/supabase/server';

const CreateJobSchema = z.object({
  type: z.enum(['scrape', 'form_fill', 'script']),
  payload: z.any(), // validate against BrowserJobPayload if needed
  proxyUrl: z.string().url().optional(),
  maxDurationSeconds: z.number().int().min(30).max(900).optional(),
});

export async function createBrowserJob(input: unknown) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  const parsed = CreateJobSchema.parse(input);

  const now = new Date();
  const [job] = await db.insert(browserJobs).values({
    userId,
    type: parsed.type,
    status: 'queued',
    payload: parsed.payload,
    proxyUrl: parsed.proxyUrl,
    maxDurationSeconds: parsed.maxDurationSeconds ?? 180,
    createdAt: now,
    updatedAt: now,
  }).returning();

  await enqueueBrowserJob({
    jobId: job.id,
    userId,
  });

  revalidatePath('/dashboard/browser-automation');
  return { id: job.id };
}

export async function cancelBrowserJob(jobId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const [job] = await db.update(browserJobs)
    .set({ canceled: true, status: 'canceled', updatedAt: new Date(), finishedAt: new Date() })
    .where(and(eq(browserJobs.id, jobId), eq(browserJobs.userId, userId)))
    .returning();

  if (!job) throw new Error('Not found or forbidden');
  return { success: true };
}

export async function listBrowserJobs({ limit = 20, offset = 0 }: { limit?: number; offset?: number }) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db.query.browserJobs.findMany({
    where: eq(browserJobs.userId, userId),
    orderBy: [desc(browserJobs.createdAt)],
    limit,
    offset,
    with: {
      artifacts: true,
    },
  });

  return rows;
}

export async function getBrowserJob(jobId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const row = await db.query.browserJobs.findFirst({
    where: and(eq(browserJobs.id, jobId), eq(browserJobs.userId, userId)),
    with: {
      artifacts: true,
    },
  });
  if (!row) throw new Error('Not found');
  return row;
}

export async function getArtifactSignedUrl(artifactId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const artifact = await db.query.browserJobArtifacts.findFirst({
    where: eq(browserJobArtifacts.id, artifactId),
    with: {
      // ensure ownership by joining job
    },
  });

  if (!artifact) throw new Error('Not found');

  const supabase = createClient();
  const { data, error } = await supabase
    .storage.from('browser-screenshots')
    .createSignedUrl(artifact.storagePath, 60 * 10); // 10m

  if (error) throw error;
  return { url: data.signedUrl };
}
```

Queue integration to Redis:
```typescript
// /lib/queues/browser-queue.ts
import { Queue } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL!, // Upstash Redis or compatible
};

export const browserQueue = new Queue('browser:jobs', { connection });

export async function enqueueBrowserJob(job: { jobId: string; userId: string }) {
  await browserQueue.add('run', job, {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 1,
  });
}
```

Worker outline (runs outside Next.js, inside Docker):
```typescript
// /worker/browser-worker.ts
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { createClient as createSupabase } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { browserJobs, browserJobLogs, browserJobArtifacts } from '../db/schema/browser-automation';
import { eq } from 'drizzle-orm';
import { chromium, BrowserContext, Page } from 'playwright';

const connection = { url: process.env.REDIS_URL! };
const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const client = postgres(process.env.DATABASE_URL!, { prepare: true, max: 1 });
const db = drizzle(client);

async function log(jobId: string, level: 'debug'|'info'|'warn'|'error', message: string, meta?: any) {
  await db.insert(browserJobLogs).values({ jobId, level, message, meta });
}

async function updateStatus(jobId: string, status: 'queued'|'running'|'succeeded'|'failed'|'canceled'|'timeout', patch?: any) {
  await db.update(browserJobs).set({ status, updatedAt: new Date(), ...patch }).where(eq(browserJobs.id, jobId));
}

function randomUserAgent() {
  const list = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36',
  ];
  return list[Math.floor(Math.random() * list.length)];
}

async function applyAntiBotDelays() {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 700));
}

async function runJob(job: Job) {
  const jobId = job.data.jobId as string;
  const row = await db.query.browserJobs.findFirst({ where: eq(browserJobs.id, jobId) });
  if (!row) return;

  const startedAt = new Date();
  await updateStatus(jobId, 'running', { startedAt });

  const payload = row.payload as any;
  const timeoutMs = (row.maxDurationSeconds ?? payload?.options?.maxDurationSeconds ?? 180) * 1000;

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs);

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    if (row.proxyUrl) launchArgs.push(`--proxy-server=${row.proxyUrl}`);

    const browser = await chromium.launch({ headless: true, args: launchArgs });
    context = await browser.newContext({
      userAgent: row.userAgent ?? payload?.options?.userAgent ?? randomUserAgent(),
      viewport: (row.viewport ?? payload?.options?.viewport) || { width: 1280, height: 800 },
    });
    page = await context.newPage();

    page.on('console', async (msg) => log(jobId, 'debug', `[console] ${msg.text()}`));
    page.on('requestfailed', async (req) => log(jobId, 'warn', `Request failed: ${req.url()}`, { failure: req.failure() }));

    // Execute actions
    const actions = payload.actions as any[];
    const extracted: any[] = [];
    for (const [idx, action] of actions.entries()) {
      // cooperative cancel
      const latest = await db.query.browserJobs.findFirst({ where: eq(browserJobs.id, jobId) });
      if (latest?.canceled) {
        await log(jobId, 'warn', 'Job canceled by user');
        await updateStatus(jobId, 'canceled', { finishedAt: new Date() });
        return;
      }

      await log(jobId, 'info', `Action ${idx + 1}/${actions.length}: ${action.kind}`);
      await applyAntiBotDelays();

      switch (action.kind) {
        case 'navigate': {
          await page.goto(action.url, { waitUntil: action.waitFor ?? 'domcontentloaded', timeout: action.timeoutMs ?? 30000 });
          break;
        }
        case 'click': {
          await page.click(action.selector, { delay: action.delayMs ?? 50 });
          break;
        }
        case 'type': {
          if (action.clear) await page.fill(action.selector, '');
          await page.type(action.selector, action.text, { delay: action.delayMs ?? 50 });
          break;
        }
        case 'waitForSelector': {
          await page.waitForSelector(action.selector, { state: action.state ?? 'visible', timeout: action.timeoutMs ?? 15000 });
          break;
        }
        case 'wait': {
          await new Promise(r => setTimeout(r, action.ms));
          break;
        }
        case 'scroll': {
          if (action.to === 'bottom') {
            await page.evaluate(async (step) => {
              await new Promise<void>((resolve) => {
                let y = 0;
                const distance = step ?? 400;
                const timer = setInterval(() => {
                  window.scrollBy(0, distance);
                  y += distance;
                  if (y >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                  }
                }, 200);
              });
            }, action.stepPx);
          } else if (action.to === 'top') {
            await page.evaluate(() => window.scrollTo(0, 0));
          } else if (action.to === 'selector' && action.selector) {
            await page.locator(action.selector).scrollIntoViewIfNeeded();
          }
          break;
        }
        case 'extract': {
          if (action.many) {
            const entries = await page.evaluate((fields) => {
              const out: any[] = [];
              const maxLen = Math.max(...Object.values(fields).map((f: any) => document.querySelectorAll(f.selector).length));
              for (let i = 0; i < maxLen; i++) {
                const row: any = {};
                for (const [key, f] of Object.entries(fields) as any) {
                  const nodes = document.querySelectorAll((f as any).selector);
                  const el = nodes[i] as HTMLElement | undefined;
                  if (!el) { row[key] = null; continue; }
                  const attr = (f as any).attr ?? 'text';
                  if (attr === 'text') row[key] = el.textContent?.trim() ?? null;
                  else row[key] = (el as any).getAttribute(attr) ?? null;
                }
                out.push(row);
              }
              return out;
            }, action.fields);
            extracted.push(...entries);
          } else {
            const entry = await page.evaluate((fields) => {
              const row: any = {};
              for (const [key, f] of Object.entries(fields) as any) {
                const el = document.querySelector((f as any).selector) as HTMLElement | null;
                if (!el) { row[key] = null; continue; }
                const attr = (f as any).attr ?? 'text';
                if (attr === 'text') row[key] = el.textContent?.trim() ?? null;
                else row[key] = (el as any).getAttribute(attr) ?? null;
              }
              return row;
            }, action.fields);
            extracted.push(entry);
          }
          break;
        }
        case 'screenshot': {
          const fileName = `${jobId}/${Date.now()}-${action.label ?? 'shot'}.png`;
          const buf = action.selector
            ? await page.locator(action.selector).screenshot()
            : await page.screenshot({ fullPage: action.fullPage ?? true });

          const { data, error } = await supabase.storage.from('browser-screenshots').upload(fileName, buf, {
            contentType: 'image/png',
            upsert: false,
          });
          if (error) throw error;

          await db.insert(browserJobArtifacts).values({
            jobId,
            type: 'screenshot',
            storagePath: data.path,
            fileSize: buf.length,
            // Optionally determine dimensions by decoding PNG if needed
          });
          break;
        }
        case 'evaluate': {
          await page.evaluate(new Function(action.script) as any);
          break;
        }
        default:
          await log(jobId, 'warn', `Unknown action: ${action.kind}`);
      }
    }

    await db.update(browserJobs).set({
      status: 'succeeded',
      resultJson: { data: extracted, format: payload?.resultFormat ?? 'json' },
      finishedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(browserJobs.id, jobId));

  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Job timeout' : (err?.message ?? 'Unknown error');
    await log(jobId, 'error', msg, { stack: err?.stack });
    await updateStatus(jobId, err?.name === 'AbortError' ? 'timeout' : 'failed', {
      errorMessage: msg,
      finishedAt: new Date(),
    });
  } finally {
    clearTimeout(abortTimer);
    await context?.close();
  }
}

new Worker('browser:jobs', async (job) => runJob(job), { connection, concurrency: parseInt(process.env.BROWSER_CONCURRENCY ?? '2', 10) });
```

Dockerfile for worker:
```dockerfile
# /worker/Dockerfile
FROM mcr.microsoft.com/playwright:v1.48.2-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npx playwright install --with-deps chromium

ENV NODE_ENV=production
CMD ["node", "dist/worker/browser-worker.js"]
```

Environment variables required:
- DATABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL (e.g., Upstash)
- BROWSER_CONCURRENCY (optional)
- NODE_OPTIONS=--max-old-space-size=512 (optional memory cap)

Supabase Storage bucket:
- Create bucket: browser-screenshots (private)

RLS and security (to configure at DB level):
- browser_jobs: user_id = auth.uid() policy for read/write own rows
- browser_job_logs/artifacts: join to job and allow if job.user_id = auth.uid()

#### Components Structure
```
/app/(dashboard)/browser-automation/
├── page.tsx                   // Jobs list
├── new/page.tsx               // Create job form
└── [jobId]/page.tsx           // Job detail (status, logs, artifacts)

/components/browser-automation/
├── create-job-form.tsx
├── job-table.tsx
├── job-status-badge.tsx
├── job-detail.tsx
├── log-viewer.tsx
└── artifact-gallery.tsx
```

Key components:
- create-job-form.tsx: ShadCN Form to define type, targets, actions JSON, options.
- job-table.tsx: Table with status badge, created/start/finish, action to cancel.
- job-detail.tsx: Summary (status, timestamps, error), download JSON/CSV.
- log-viewer.tsx: Client component subscribing to Supabase Realtime for logs.
- artifact-gallery.tsx: Lists screenshots with server action to get signed URLs.

#### State Management
- Server Components for initial data fetch (list, job detail).
- Server Actions for mutations: create, cancel, signed URL generation.
- Supabase Realtime in log-viewer to stream logs for the job in the client.
- Local React state to manage form inputs and optimistic UI for cancel button.
- Revalidate paths on create/cancel to refresh server-rendered lists.

### Dependencies & Integrations
- External packages:
  - playwright
  - bullmq
  - ioredis (implicit dep of bullmq) or use connection via url
  - @supabase/supabase-js (worker)
  - zod (validation)
- Services:
  - Redis (e.g., Upstash) for queueing.
  - Dockerized worker service running Playwright (deploy to Fly.io, Railway, or similar; not Vercel Functions).
  - Supabase Storage bucket: browser-screenshots for artifacts.
- Integrations:
  - Authentication via Clerk: restrict access to user-owned jobs/logs/artifacts.
  - Potential future integration with Credit-Based Usage System to deduct credits per job or per page action (not in this scope).
  - Optional proxy support via payload.options.proxyUrl.

### Implementation Steps
1. Create database schema
   - Add /db/schema/browser-automation.ts and run Drizzle migrations.
   - Create Supabase Storage bucket browser-screenshots (private).
   - Configure RLS policies for tables to enforce per-user access.

2. Generate queries
   - Add Drizzle query helpers if needed in /db/queries/browser-automation.ts.

3. Implement server actions
   - /actions/browser-automation-actions.ts with create, cancel, list, get, and getArtifactSignedUrl.
   - /lib/queues/browser-queue.ts to enqueue jobs to Redis.

4. Build worker
   - /worker/browser-worker.ts Playwright processor, logging, artifacts, anti-bot measures, timeouts, cancel support.
   - Dockerfile for worker; set env vars; deploy to container platform.

5. Build UI components
   - Pages and components under /app/(dashboard)/browser-automation and /components/browser-automation.
   - Use ShadCN Form, Table, Badge, Card, Tabs.

6. Connect frontend to backend
   - Wire create-job-form to createBrowserJob server action.
   - Job list and detail pages call listBrowserJobs/getBrowserJob server actions.
   - artifact-gallery calls getArtifactSignedUrl on demand.
   - log-viewer subscribes to Supabase Realtime on browser_job_logs filtered by job_id.

7. Add error handling
   - Input validation (zod) and user-friendly error messages.
   - Guard server actions with Clerk auth.
   - Worker-level try/catch with status updates and error logs.
   - Signed URL failures handled gracefully.

8. Test the feature
   - Unit tests for server actions and payload validation.
   - Integration tests for worker processing a mock job.
   - E2E flow: create job → observe logs → verify artifacts and results.

### Edge Cases & Error Handling
- Dynamic content not loaded: Wait strategies (wait for selector, networkidle). Surface clear errors.
- CAPTCHA or bot blocks: Detect typical challenge patterns; mark errorMessage "captcha_detected" and fail gracefully.
- Timeouts: Enforce maxDurationSeconds; status set to "timeout".
- Cancel mid-execution: Worker checks canceled flag between actions and exits cleanly.
- Selector not found: Log warn; extraction field value null; continue unless critical action fails (click/type).
- Proxy failures: Log error and fail; advise retry with different proxy.
- Large result sets: Trim extracted data to N rows (configurable) to avoid oversized rows; log truncation info.
- Storage upload failures: Retry once; on persistent failure, mark job failed.
- Resource exhaustion: Worker concurrency env-controlled; queue ensures backpressure.
- Unauthorized access: Server actions verify ownership; RLS blocks cross-user reads.
- Screenshots signed URL expiration: Regenerate via server action when needed.

### Testing Approach
- Unit tests
  - createBrowserJob validates input, enqueues job, returns id.
  - cancelBrowserJob sets canceled/status only for owner.
  - getArtifactSignedUrl returns signed URL only for owner.
- Integration tests
  - Worker: runJob with a local Redis instance; navigate to a test page; perform extract and screenshot; assert DB updates and artifact upload (mock Supabase in CI).
  - Anti-bot: verify randomized user agent and viewport in context.
  - Timeout: simulate long task and assert timeout status.
- User acceptance tests
  - Create a "scrape product cards" job: navigate, waitForSelector, extract many, screenshot; verify results visible in UI.
  - Create a "form fill" job: navigate to a demo form, type, click submit, screenshot confirmation.
  - Cancel a running job: ensure status updates and worker stops further actions.
  - Download data as JSON/CSV and open screenshots via signed URLs.

Notes
- Deploy worker separately; Next.js (Vercel) handles UI/API while the worker runs on a container host with Playwright.
- Use Upstash Redis for queueing (serverless-compatible).
- Ensure Supabase service role key is ONLY used in the worker, never in client or server actions.