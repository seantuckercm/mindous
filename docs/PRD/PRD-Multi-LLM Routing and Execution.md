## Feature: Multi-LLM Routing & Execution

### Overview
This feature intelligently routes each subtask to the most suitable LLM provider and model (OpenAI, Anthropic, Google) using a scoring engine that balances task fit, performance (latency, success rate), and cost. It executes the subtask through a unified SDK wrapper, includes fallback handling and circuit breakers, caches results for repeated prompts, and logs all usage and metrics for analytics.

### User Stories & Requirements
- As a system (agent router), I want to automatically select the best LLM for a given subtask so that performance and cost are optimized.
  - Acceptance:
    - Given a subtask with metadata (taskType, complexity), the router selects a provider+model using a scoring algorithm that considers task fit, cost per 1k tokens, historical latency, and success rate.
    - Routing decisions are logged with scored factors.
- As a system (executor), I want to execute the subtask via a unified API so that providers are interchangeable behind a single interface.
  - Acceptance:
    - Execution succeeds for any enabled provider when keys are available.
    - Responses unify to a common shape (text content, tokens, model info).
- As a system (reliability), I want fallback handling and circuit breakers so that failures do not cascade and SLAs are preserved.
  - Acceptance:
    - On rate limit/timeout/failure, retry with exponential backoff (configurable), then fallback to next-best provider.
    - Providers tripping thresholds enter open circuit for a cooldown period and are skipped during routing.
- As a system (efficiency), I want to cache results for similar tasks so that repeated prompts are faster and cheaper.
  - Acceptance:
    - Normalized prompt fingerprint lookup returns a cached result if not expired and allowed by privacy settings.
    - Cache metadata records hit counts and last-hit timestamps.
- As an admin/analyst, I want to view usage metrics so that I can understand cost, reliability, and performance per provider.
  - Acceptance:
    - Usage logs include provider, model, tokens in/out, cost estimate, latency, status, cache hit, and correlationId.
    - Aggregated provider stats (avg latency, success rate) are updated after each call.

### Technical Implementation

#### Database Schema
```typescript
// /db/schema/llm-routing.ts
import { pgTable, uuid, text, boolean, integer, numeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Log every LLM call (success/failure)
export const llmUsageLogs = pgTable('llm_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  correlationId: uuid('correlation_id').notNull().defaultRandom(), // idempotency/trace
  userId: text('user_id'), // Clerk user id if available
  subtaskId: uuid('subtask_id'), // references subtasks table (external)
  provider: text('provider').notNull(), // 'openai' | 'anthropic' | 'google'
  model: text('model').notNull(),
  promptHash: text('prompt_hash').notNull(),
  status: text('status').notNull(), // 'success' | 'failure' | 'timeout' | 'rate_limited'
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  costEstimateUsd: numeric('cost_estimate_usd', { precision: 12, scale: 6 }),
  cacheHit: boolean('cache_hit').notNull().default(false),
  routedScore: jsonb('routed_score'), // { total, factors: { cost, latency, successRate, taskFit } }
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`),
});
export const llmUsageLogsProviderIdx = sql`create index if not exists llm_usage_logs_provider_idx on llm_usage_logs (provider, model)`;
export const llmUsageLogsSubtaskIdx = sql`create index if not exists llm_usage_logs_subtask_idx on llm_usage_logs (subtask_id)`;
export const llmUsageLogsPromptIdx = sql`create index if not exists llm_usage_logs_prompt_idx on llm_usage_logs (prompt_hash)`;

// Aggregated stats per provider+model (updated by app after each call)
export const llmProviderStats = pgTable('llm_provider_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  costPer1kInputUsd: numeric('cost_per_1k_input_usd', { precision: 10, scale: 6 }).notNull(),
  costPer1kOutputUsd: numeric('cost_per_1k_output_usd', { precision: 10, scale: 6 }).notNull(),
  latencyAvgMs: integer('latency_avg_ms').notNull().default(0),
  latencyP95Ms: integer('latency_p95_ms').notNull().default(0),
  successRate: numeric('success_rate', { precision: 5, scale: 4 }).notNull().default('0'), // 0..1
  totalCalls: integer('total_calls').notNull().default(0),
  errorRate: numeric('error_rate', { precision: 5, scale: 4 }).notNull().default('0'), // 0..1
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
}, (t) => ({
  providerModelUnique: sql`unique (provider, model)`,
}));

// Result cache for repeated prompts (scoped)
export const llmRouteCache = pgTable('llm_route_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  scope: text('scope').notNull().default('system'), // 'system' | 'tenant' | 'user'
  ownerId: text('owner_id'), // optional tenant/user id based on scope
  promptHash: text('prompt_hash').notNull(), // sha256 of normalized prompt+context
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  response: jsonb('response').notNull(), // cached structured response
  tokensOutput: integer('tokens_output'),
  hitCount: integer('hit_count').notNull().default(0),
  lastHitAt: timestamp('last_hit_at', { mode: 'string' }),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().default(sql`now()`),
}, (t) => ({
  uniqueKey: sql`unique (scope, owner_id, prompt_hash)`,
}));

export const llmRouteCacheIdx = sql`create index if not exists llm_route_cache_idx on llm_route_cache (prompt_hash, expires_at)`;

// Circuit breaker state per provider+model
export const llmCircuitBreakers = pgTable('llm_circuit_breakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  state: text('state').notNull().default('closed'), // 'closed' | 'open' | 'half_open'
  failureCount: integer('failure_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  openedAt: timestamp('opened_at', { mode: 'string' }),
  nextAttemptAt: timestamp('next_attempt_at', { mode: 'string' }),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().default(sql`now()`),
}, (t) => ({
  uniqueCB: sql`unique (provider, model)`,
}));
```

#### API Endpoints / Server Actions
```typescript
// /lib/llm/types.ts
export type Provider = 'openai' | 'anthropic' | 'google';

export type RouteContext = {
  taskType?: 'code' | 'writing' | 'analysis' | 'extraction' | 'reasoning';
  complexity?: 'low' | 'medium' | 'high';
  maxTokens?: number;
  temperature?: number;
  allowCache?: boolean;
  scope?: 'system' | 'tenant' | 'user';
  ownerId?: string | null;
};

export type RouteAndExecuteInput = {
  subtaskId?: string;
  userId?: string;
  prompt: string;
  system?: string;
  stream?: boolean; // future: streaming integration
  context?: RouteContext;
  idempotencyKey?: string; // optional
};

export type UnifiedLLMResponse = {
  provider: Provider;
  model: string;
  content: string;
  tokensInput?: number;
  tokensOutput?: number;
  raw?: unknown;
};
```

```typescript
// /lib/llm/providers/openai.ts
import OpenAI from 'openai';
import { UnifiedLLMResponse } from '../types';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(model: string, prompt: string, opts?: { system?: string; maxTokens?: number; temperature?: number }): Promise<UnifiedLLMResponse> {
  const start = Date.now();
  const res = await client.chat.completions.create({
    model,
    messages: [
      ...(opts?.system ? [{ role: 'system', content: opts.system }] : []),
      { role: 'user', content: prompt },
    ],
    temperature: opts?.temperature ?? 0.2,
    max_tokens: opts?.maxTokens,
  });
  const content = res.choices?.[0]?.message?.content ?? '';
  const latency = Date.now() - start;
  return {
    provider: 'openai',
    model,
    content,
    tokensInput: res.usage?.prompt_tokens ?? undefined,
    tokensOutput: res.usage?.completion_tokens ?? undefined,
    raw: { latencyMs: latency, ...res },
  };
}
```

```typescript
// /lib/llm/providers/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { UnifiedLLMResponse } from '../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function callAnthropic(model: string, prompt: string, opts?: { system?: string; maxTokens?: number; temperature?: number }): Promise<UnifiedLLMResponse> {
  const start = Date.now();
  const res = await client.messages.create({
    model,
    max_tokens: opts?.maxTokens ?? 1024,
    temperature: opts?.temperature ?? 0.2,
    system: opts?.system,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content?.[0]?.type === 'text' ? res.content[0].text : (res.content as any[]).map((c: any) => c.text ?? '').join('\n');
  const latency = Date.now() - start;
  return {
    provider: 'anthropic',
    model,
    content: text ?? '',
    // Anthropic usage tokens vary; keep undefined or map if available
    raw: { latencyMs: latency, ...res },
  };
}
```

```typescript
// /lib/llm/providers/google.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UnifiedLLMResponse } from '../types';

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function callGoogle(model: string, prompt: string, opts?: { system?: string; maxTokens?: number; temperature?: number }): Promise<UnifiedLLMResponse> {
  const start = Date.now();
  const genModel = client.getGenerativeModel({ model });
  const res = await genModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: [opts?.system, prompt].filter(Boolean).join('\n\n') }] }],
    generationConfig: {
      maxOutputTokens: opts?.maxTokens,
      temperature: opts?.temperature ?? 0.2,
    },
  });
  const text = res.response.text();
  const latency = Date.now() - start;
  return {
    provider: 'google',
    model,
    content: text ?? '',
    raw: { latencyMs: latency, ...res },
  };
}
```

```typescript
// /lib/llm/rules.ts
import { Provider } from './types';

export function preferredModelsForTask(taskType?: string): { provider: Provider; model: string; weight: number }[] {
  switch (taskType) {
    case 'code':
      return [
        { provider: 'openai', model: process.env.OPENAI_CODE_MODEL ?? 'gpt-4o-mini', weight: 1.0 },
        { provider: 'anthropic', model: process.env.ANTHROPIC_ALT_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 0.7 },
        { provider: 'google', model: process.env.GOOGLE_ALT_MODEL ?? 'gemini-1.5-pro', weight: 0.6 },
      ];
    case 'writing':
      return [
        { provider: 'anthropic', model: process.env.ANTHROPIC_WRITE_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 1.0 },
        { provider: 'openai', model: process.env.OPENAI_ALT_MODEL ?? 'gpt-4o-mini', weight: 0.8 },
        { provider: 'google', model: process.env.GOOGLE_ALT_MODEL ?? 'gemini-1.5-pro', weight: 0.7 },
      ];
    case 'analysis':
    case 'extraction':
      return [
        { provider: 'google', model: process.env.GOOGLE_ANALYSIS_MODEL ?? 'gemini-1.5-pro', weight: 1.0 },
        { provider: 'openai', model: process.env.OPENAI_ALT_MODEL ?? 'gpt-4o-mini', weight: 0.8 },
        { provider: 'anthropic', model: process.env.ANTHROPIC_ALT_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 0.7 },
      ];
    default:
      return [
        { provider: 'openai', model: process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini', weight: 1.0 },
        { provider: 'anthropic', model: process.env.ANTHROPIC_DEFAULT_MODEL ?? 'claude-3-5-sonnet-20241022', weight: 0.9 },
        { provider: 'google', model: process.env.GOOGLE_DEFAULT_MODEL ?? 'gemini-1.5-pro', weight: 0.8 },
      ];
  }
}
```

```typescript
// /lib/llm/circuitBreaker.ts
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { llmCircuitBreakers } from '@/db/schema/llm-routing';

const FAILURE_THRESHOLD = 5;
const COOL_DOWN_MS = 60_000;

export async function getCircuitState(provider: string, model: string) {
  const [row] = await db.select().from(llmCircuitBreakers).where(eq(llmCircuitBreakers.provider, provider) as any && eq(llmCircuitBreakers.model, model) as any).limit(1);
  return row;
}

export async function recordSuccess(provider: string, model: string) {
  const now = new Date();
  await db
    .insert(llmCircuitBreakers)
    .values({ provider, model, state: 'closed', successCount: 1, failureCount: 0, updatedAt: now.toISOString() })
    .onConflictDoUpdate({
      target: [llmCircuitBreakers.provider, llmCircuitBreakers.model],
      set: { state: 'closed', successCount: 0, failureCount: 0, updatedAt: now.toISOString(), openedAt: null, nextAttemptAt: null },
    });
}

export async function recordFailure(provider: string, model: string) {
  const now = new Date();
  const [row] = await db.select().from(llmCircuitBreakers).where(eq(llmCircuitBreakers.provider, provider) as any && eq(llmCircuitBreakers.model, model) as any).limit(1);
  const failures = (row?.failureCount ?? 0) + 1;
  const open = failures >= FAILURE_THRESHOLD;
  const update: any = {
    failureCount: failures,
    updatedAt: now.toISOString(),
  };
  if (open) {
    update.state = 'open';
    update.openedAt = now.toISOString();
    update.nextAttemptAt = new Date(now.getTime() + COOL_DOWN_MS).toISOString();
  }
  await db
    .insert(llmCircuitBreakers)
    .values({ provider, model, state: open ? 'open' : 'closed', failureCount: failures, updatedAt: now.toISOString(), openedAt: open ? now.toISOString() : null, nextAttemptAt: open ? new Date(now.getTime() + COOL_DOWN_MS).toISOString() : null })
    .onConflictDoUpdate({ target: [llmCircuitBreakers.provider, llmCircuitBreakers.model], set: update });
}

export function isAvailable(row?: { state?: string; nextAttemptAt?: string | null }) {
  if (!row) return true;
  if (row.state === 'open' && row.nextAttemptAt) {
    return new Date(row.nextAttemptAt) < new Date();
  }
  return row.state !== 'open';
}
```

```typescript
// /lib/llm/cache.ts
import crypto from 'crypto';
import { db } from '@/db';
import { and, eq, lt } from 'drizzle-orm';
import { llmRouteCache } from '@/db/schema/llm-routing';

export function promptFingerprint(input: { prompt: string; system?: string; context?: Record<string, any> }) {
  const normalized = JSON.stringify({
    p: input.prompt.trim().replace(/\s+/g, ' '),
    s: input.system ?? '',
    c: input.context ?? {},
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function getFromCache(scope: string, ownerId: string | null | undefined, promptHash: string) {
  const now = new Date().toISOString();
  const rows = await db
    .select()
    .from(llmRouteCache)
    .where(and(eq(llmRouteCache.scope, scope), eq(llmRouteCache.ownerId, ownerId ?? null) as any, eq(llmRouteCache.promptHash, promptHash), lt(llmRouteCache.expiresAt, '9999-12-31')) as any)
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;
  await db.update(llmRouteCache).set({ hitCount: (row.hitCount ?? 0) + 1, lastHitAt: now }).where(eq(llmRouteCache.id, row.id) as any);
  return row;
}

export async function setCache(entry: {
  scope: string;
  ownerId?: string | null;
  promptHash: string;
  provider: string;
  model: string;
  response: any;
  tokensOutput?: number | null;
  ttlSeconds: number;
}) {
  const expiresAt = new Date(Date.now() + entry.ttlSeconds * 1000).toISOString();
  await db
    .insert(llmRouteCache)
    .values({
      scope: entry.scope,
      ownerId: entry.ownerId ?? null,
      promptHash: entry.promptHash,
      provider: entry.provider,
      model: entry.model,
      response: entry.response,
      tokensOutput: entry.tokensOutput ?? null,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [llmRouteCache.scope, llmRouteCache.ownerId, llmRouteCache.promptHash],
      set: { provider: entry.provider, model: entry.model, response: entry.response, tokensOutput: entry.tokensOutput ?? null, expiresAt },
    });
}
```

```typescript
// /lib/llm/router.ts
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { llmProviderStats, llmUsageLogs } from '@/db/schema/llm-routing';
import { preferredModelsForTask } from './rules';
import { callOpenAI } from './providers/openai';
import { callAnthropic } from './providers/anthropic';
import { callGoogle } from './providers/google';
import { getCircuitState, isAvailable, recordFailure, recordSuccess } from './circuitBreaker';
import { getFromCache, promptFingerprint, setCache } from './cache';
import { Provider, RouteAndExecuteInput, UnifiedLLMResponse } from './types';

const WEIGHTS = { cost: 0.35, latency: 0.25, success: 0.2, taskFit: 0.2 };
const CACHE_TTL_SECONDS_DEFAULT = 600;

function normalizeScore(x: number, min: number, max: number, invert = false) {
  if (max === min) return 0.5;
  const s = (x - min) / (max - min);
  return invert ? 1 - s : s;
}

async function fetchStats() {
  const stats = await db.select().from(llmProviderStats);
  return stats.filter((s) => s.enabled);
}

function costPer1k(stats: any) {
  // approximate: equally weight input and output if unknown
  return Number(stats.costPer1kInputUsd) * 0.5 + Number(stats.costPer1kOutputUsd) * 0.5;
}

export async function scoreCandidates(context: RouteAndExecuteInput['context']) {
  const candidates = preferredModelsForTask(context?.taskType);
  const stats = await fetchStats();
  // derive min/max for normalization
  const costs = candidates.map(c => costPer1k(stats.find(s => s.provider === c.provider && s.model === c.model) ?? { costPer1kInputUsd: 0.002, costPer1kOutputUsd: 0.004 }));
  const latencies = candidates.map(c => (stats.find(s => s.provider === c.provider && s.model === c.model)?.latencyAvgMs ?? 1500));
  const successes = candidates.map(c => (Number(stats.find(s => s.provider === c.provider && s.model === c.model)?.successRate ?? 0.95)));
  const minCost = Math.min(...costs), maxCost = Math.max(...costs);
  const minLat = Math.min(...latencies), maxLat = Math.max(...latencies);
  const minSucc = Math.min(...successes), maxSucc = Math.max(...successes);

  return await Promise.all(candidates.map(async (c, i) => {
    const st = stats.find(s => s.provider === c.provider && s.model === c.model);
    const costScore = normalizeScore(costs[i], minCost, maxCost, true);
    const latencyScore = normalizeScore(latencies[i], minLat, maxLat, true);
    const successScore = normalizeScore(successes[i], minSucc, maxSucc, false);
    const taskFitScore = c.weight;

    const total = WEIGHTS.cost * costScore + WEIGHTS.latency * latencyScore + WEIGHTS.success * successScore + WEIGHTS.taskFit * taskFitScore;
    const cb = await getCircuitState(c.provider, c.model);
    const available = isAvailable(cb);

    return { ...c, total, factors: { costScore, latencyScore, successScore, taskFitScore }, available };
  }));
}

async function callProvider(provider: Provider, model: string, prompt: string, opts: { system?: string; maxTokens?: number; temperature?: number }): Promise<UnifiedLLMResponse> {
  switch (provider) {
    case 'openai': return callOpenAI(model, prompt, opts);
    case 'anthropic': return callAnthropic(model, prompt, opts);
    case 'google': return callGoogle(model, prompt, opts);
    default: throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function routeAndExecute(input: RouteAndExecuteInput): Promise<UnifiedLLMResponse & { cacheHit?: boolean; correlationId: string }> {
  const ctx = input.context ?? {};
  const scope = ctx.scope ?? 'system';
  const ownerId = ctx.ownerId ?? null;

  const promptHash = promptFingerprint({ prompt: input.prompt, system: input.system, context: { taskType: ctx.taskType } });

  if (ctx.allowCache) {
    const cached = await getFromCache(scope, ownerId, promptHash);
    if (cached) {
      // minimal log row for cache hit
      const correlationId = crypto.randomUUID();
      await db.insert(llmUsageLogs).values({
        correlationId,
        userId: input.userId ?? null,
        subtaskId: input.subtaskId as any ?? null,
        provider: cached.provider,
        model: cached.model,
        promptHash,
        status: 'success',
        cacheHit: true,
        latencyMs: 0,
        tokensInput: null,
        tokensOutput: cached.tokensOutput ?? null,
        costEstimateUsd: '0',
        routedScore: null,
      });
      return { provider: cached.provider as Provider, model: cached.model, content: cached.response.content, raw: cached.response, tokensOutput: cached.tokensOutput ?? undefined, cacheHit: true, correlationId };
    }
  }

  const candidates = await scoreCandidates(ctx);
  const sorted = candidates
    .filter(c => c.available)
    .sort((a, b) => b.total - a.total);

  if (sorted.length === 0) {
    throw new Error('No available providers/models at this time (circuit breakers open)');
  }

  const correlationId = crypto.randomUUID();
  const opts = { system: input.system, maxTokens: ctx.maxTokens, temperature: ctx.temperature ?? 0.2 };

  let lastError: any;
  for (const cand of sorted) {
    // Verify API key presence
    if (cand.provider === 'openai' && !process.env.OPENAI_API_KEY) continue;
    if (cand.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) continue;
    if (cand.provider === 'google' && !process.env.GOOGLE_API_KEY) continue;

    // retry with simple exponential backoff
    for (let attempt = 0; attempt < 2; attempt++) {
      const start = Date.now();
      try {
        const res = await callProvider(cand.provider as Provider, cand.model, input.prompt, opts);
        const latencyMs = Date.now() - start;

        // Estimate cost if possible via stats
        const [stat] = await db.select().from(llmProviderStats).where(eq(llmProviderStats.provider, cand.provider) as any && eq(llmProviderStats.model, cand.model) as any).limit(1);
        const costIn = res.tokensInput ? Number(stat?.costPer1kInputUsd ?? 0) * (res.tokensInput / 1000) : 0;
        const costOut = res.tokensOutput ? Number(stat?.costPer1kOutputUsd ?? 0) * (res.tokensOutput / 1000) : 0;
        const costEstimate = (costIn + costOut).toFixed(6);

        await db.insert(llmUsageLogs).values({
          correlationId,
          userId: input.userId ?? null,
          subtaskId: input.subtaskId as any ?? null,
          provider: cand.provider,
          model: cand.model,
          promptHash,
          status: 'success',
          cacheHit: false,
          latencyMs,
          tokensInput: res.tokensInput ?? null,
          tokensOutput: res.tokensOutput ?? null,
          costEstimateUsd: costEstimate,
          routedScore: { total: cand.total, factors: cand.factors },
        });

        // update provider stats (simple rolling update)
        await db
          .insert(llmProviderStats)
          .values({
            provider: cand.provider,
            model: cand.model,
            enabled: true,
            costPer1kInputUsd: stat?.costPer1kInputUsd ?? '0.002',
            costPer1kOutputUsd: stat?.costPer1kOutputUsd ?? '0.004',
            latencyAvgMs: latencyMs,
            latencyP95Ms: latencyMs,
            successRate: '1',
            totalCalls: (stat?.totalCalls ?? 0) + 1,
            errorRate: '0',
          })
          .onConflictDoUpdate({
            target: [llmProviderStats.provider, llmProviderStats.model],
            set: {
              updatedAt: new Date().toISOString(),
              totalCalls: (stat?.totalCalls ?? 0) + 1,
              // naive EMA for averages
              latencyAvgMs: Math.round(((stat?.latencyAvgMs ?? latencyMs) * 0.8) + latencyMs * 0.2),
              successRate: (Number(stat?.successRate ?? 0.95) * 0.99 + 0.01).toFixed(4),
              errorRate: (Number(stat?.errorRate ?? 0.05) * 0.99).toFixed(4),
            } as any,
          });

        await recordSuccess(cand.provider, cand.model);

        if (ctx.allowCache) {
          await setCache({
            scope,
            ownerId,
            promptHash,
            provider: res.provider,
            model: res.model,
            response: { content: res.content, raw: undefined },
            tokensOutput: res.tokensOutput ?? null,
            ttlSeconds: CACHE_TTL_SECONDS_DEFAULT,
          });
        }

        return { ...res, cacheHit: false, correlationId };
      } catch (err: any) {
        lastError = err;
        await recordFailure(cand.provider, cand.model);

        await db.insert(llmUsageLogs).values({
          correlationId,
          userId: input.userId ?? null,
          subtaskId: input.subtaskId as any ?? null,
          provider: cand.provider,
          model: cand.model,
          promptHash,
          status: err?.status === 429 ? 'rate_limited' : (err?.name === 'TimeoutError' ? 'timeout' : 'failure'),
          errorCode: String(err?.status ?? err?.code ?? 'ERR'),
          errorMessage: (err?.message ?? 'Unknown error').slice(0, 500),
          cacheHit: false,
        });

        // simple backoff
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }

  throw new Error(`All provider attempts failed. Last error: ${(lastError?.message ?? 'Unknown')}`);
}
```

```typescript
// /actions/llm-actions.ts
'use server';

import { z } from 'zod';
import { routeAndExecute } from '@/lib/llm/router';
import { currentUser } from '@clerk/nextjs/server';

const RouteSchema = z.object({
  subtaskId: z.string().uuid().optional(),
  prompt: z.string().min(1),
  system: z.string().optional(),
  stream: z.boolean().optional(),
  context: z.object({
    taskType: z.enum(['code', 'writing', 'analysis', 'extraction', 'reasoning']).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    allowCache: z.boolean().optional(),
    scope: z.enum(['system', 'tenant', 'user']).optional(),
    ownerId: z.string().optional(),
  }).optional(),
  idempotencyKey: z.string().optional(),
});

export async function routeAndExecuteSubtaskAction(input: unknown) {
  const parsed = RouteSchema.parse(input);
  const user = await currentUser();
  const res = await routeAndExecute({
    ...parsed,
    userId: user?.id,
  });
  return res;
}
```

#### Components Structure
```
/components/llm/
├── router-status-badge.tsx        // Shows which provider/model executed or cache-hit
├── usage-table.tsx                // Admin/analytics: table of recent llmUsageLogs
└── circuit-breaker-status.tsx     // Shows CB state per provider/model
```

Example component stubs:
```tsx
// /components/llm/router-status-badge.tsx
'use client';
import { Badge } from '@/components/ui/badge';

export function RouterStatusBadge(props: { provider: string; model: string; cacheHit?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={props.cacheHit ? 'secondary' : 'default'}>{props.provider}:{props.model}</Badge>
      {props.cacheHit && <span className="text-xs text-muted-foreground">cache</span>}
    </div>
  );
}
```

```tsx
// /components/llm/usage-table.tsx
import { db } from '@/db';
import { llmUsageLogs } from '@/db/schema/llm-routing';

export async function LLMUsageTable() {
  const rows = await db.select().from(llmUsageLogs).limit(50).orderBy((llmUsageLogs as any).createdAt.desc());
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr><th>Time</th><th>Provider</th><th>Model</th><th>Status</th><th>Latency</th><th>Cost</th><th>Cache</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt!).toLocaleString()}</td>
              <td>{r.provider}</td>
              <td>{r.model}</td>
              <td>{r.status}</td>
              <td>{r.latencyMs ?? '-'}</td>
              <td>${r.costEstimateUsd ?? '-'}</td>
              <td>{r.cacheHit ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### State Management
- Server-side state via Server Actions (routeAndExecuteSubtaskAction) and Drizzle for persistence.
- Client components receive server-fetched data as props; minimal client state for interactivity (e.g., table filters).
- No global client state required; routing decisions and execution happen server-side.

### Dependencies & Integrations
- Integrations:
  - Authentication: Clerk currentUser used for attribution in logs and cache scoping.
  - Database: Supabase Postgres with Drizzle ORM for logs, stats, cache, and circuit breakers.
  - Real-time streaming: Optional future integration with the real-time feature; current API supports non-streaming responses.
  - Payments/Whop: Optionally gate providers/models by subscription tier (not enforced here; add check in routeAndExecute if required).
- External APIs:
  - openai (OpenAI API)
  - @anthropic-ai/sdk (Anthropic API)
  - @google/generative-ai (Google Gemini API)
- Required npm packages beyond CodeSpring standard stack:
  - openai
  - @anthropic-ai/sdk
  - @google/generative-ai
  - zod (if not already included in boilerplate)

Environment variables:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY
- GOOGLE_API_KEY
- Optional model overrides: OPENAI_DEFAULT_MODEL, OPENAI_CODE_MODEL, ANTHROPIC_WRITE_MODEL, GOOGLE_ANALYSIS_MODEL, etc.

### Implementation Steps
1. Create database schema
   - Add /db/schema/llm-routing.ts with tables: llmUsageLogs, llmProviderStats, llmRouteCache, llmCircuitBreakers.
   - Run Drizzle migration and deploy to Supabase.
2. Generate queries
   - Ensure db client is wired; add indices via raw SQL in migration.
   - Seed llmProviderStats with initial cost values per model.
3. Implement server actions
   - Add unified provider wrappers (/lib/llm/providers/*.ts).
   - Implement router, scoring, cache, and circuit breaker helpers (/lib/llm/*.ts).
   - Expose /actions/llm-actions.ts with routeAndExecuteSubtaskAction.
4. Build UI components
   - Create RouterStatusBadge, UsageTable, CircuitBreakerStatus (minimal admin view).
   - Add an admin route (e.g., /admin/llm-usage) server page to render usage table if needed.
5. Connect frontend to backend
   - Where subtasks execute, call routeAndExecuteSubtaskAction with prompt/system/context.
   - Display RouterStatusBadge with result metadata.
6. Add error handling
   - Wrap server action in try/catch on caller; surface user-friendly errors.
   - Ensure circuit breaker updates on failures and log all outcomes.
7. Test the feature
   - Unit tests for scoring and cache fingerprint.
   - Integration tests with mocked provider SDKs.
   - Manual UAT via a test page.

### Edge Cases & Error Handling
- Missing API keys: Skip provider at runtime; if none available, throw descriptive error.
- Provider rate limits: Mark as 'rate_limited', retry with backoff, then fallback provider; update circuit breaker.
- Timeouts/network errors: Mark as 'timeout' or 'failure', fallback accordingly.
- Circuit breaker open: Provider excluded until cooldown elapses; half-open attempts after nextAttemptAt.
- Oversized prompts/output or token limits: Respect maxTokens; if provider returns token limit error, fallback to more capable model.
- Cache privacy: Only cache when allowCache is true; scope cache appropriately (system/tenant/user).
- Idempotency: correlationId logged; idempotencyKey can be added to avoid re-execution by callers (extend schema if needed).
- Cost estimation inaccuracies: When token usage unknown, log 0 and annotate; still update stats.
- Duplicate execution under concurrency: Caller should manage subtask state locking; router is stateless.

### Testing Approach
- Unit tests:
  - scoreCandidates produces higher score for preferred task fit and lower cost/latency.
  - promptFingerprint yields consistent hash for semantically same prompts.
  - circuitBreaker state transitions on repeated failures.
- Integration tests:
  - routeAndExecute falls back when provider 1 fails and provider 2 succeeds (mock SDKs to throw/return).
  - Cache hit returns cached response and logs cacheHit=true.
  - Logs persisted with correct routedScore and metrics.
- User acceptance tests:
  - Given a "code" subtask, OpenAI is chosen when available and provides expected response; fallback works if API key missing.
  - Under artificial rate limits, execution still completes via alternative provider within acceptable latency.
  - Admin can view recent LLM usage entries with accurate provider/model, status, and cost estimate.

Notes and Best Practices:
- Do not store API keys in DB; use environment variables and server-only code paths.
- Validate inputs with zod; ensure server actions include 'use server'.
- Add monitoring/logs for router errors (e.g., console.error or a logging service) without leaking secrets.
- Keep provider stats up to date with lightweight EMA updates; consider a background job for rigorous rollups later.