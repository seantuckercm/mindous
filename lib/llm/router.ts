import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { llmProviderStatsTable, llmUsageLogsTable } from '@/db/schema/llm-routing';
import { preferredModelsForTask } from './rules';
import { callOpenAI } from './providers/openai';
import { callAnthropic } from './providers/anthropic';
import { callGoogle } from './providers/google';
import { getCircuitState, isAvailable, recordFailure, recordSuccess } from './circuitBreaker';
import { getFromCache, promptFingerprint, setCache } from './cache';
import { Provider, RouteAndExecuteInput, UnifiedLLMResponse } from './types';
import crypto from 'crypto';

const WEIGHTS = { cost: 0.35, latency: 0.25, success: 0.2, taskFit: 0.2 };
const CACHE_TTL_SECONDS_DEFAULT = 600;

function normalizeScore(x: number, min: number, max: number, invert = false) {
  if (max === min) return 0.5;
  const s = (x - min) / (max - min);
  return invert ? 1 - s : s;
}

async function fetchStats() {
  const stats = await db.select().from(llmProviderStatsTable);
  return stats.filter((s) => s.enabled);
}

function costPer1k(stats: any) {
  return Number(stats.costPer1kInputUsd) * 0.5 + Number(stats.costPer1kOutputUsd) * 0.5;
}

export async function scoreCandidates(context: RouteAndExecuteInput['context']) {
  const candidates = preferredModelsForTask(context?.taskType);
  const stats = await fetchStats();
  
  const costs = candidates.map(c => {
    const stat = stats.find(s => s.provider === c.provider && s.model === c.model);
    return stat ? costPer1k(stat) : 0.002;
  });
  
  const latencies = candidates.map(c => {
    const stat = stats.find(s => s.provider === c.provider && s.model === c.model);
    return stat?.latencyAvgMs ?? 1500;
  });
  
  const successes = candidates.map(c => {
    const stat = stats.find(s => s.provider === c.provider && s.model === c.model);
    return Number(stat?.successRate ?? 0.95);
  });
  
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minLat = Math.min(...latencies);
  const maxLat = Math.max(...latencies);
  const minSucc = Math.min(...successes);
  const maxSucc = Math.max(...successes);

  return await Promise.all(candidates.map(async (c, i) => {
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
      const correlationId = crypto.randomUUID();
      await db.insert(llmUsageLogsTable).values({
        correlationId,
        userId: input.userId ?? null,
        subtaskId: input.subtaskId ?? null,
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
      return { 
        provider: cached.provider as Provider, 
        model: cached.model, 
        content: cached.response.content, 
        raw: cached.response, 
        tokensOutput: cached.tokensOutput ?? undefined, 
        cacheHit: true, 
        correlationId 
      };
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
    if (cand.provider === 'openai' && !process.env.OPENAI_API_KEY) continue;
    if (cand.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) continue;
    if (cand.provider === 'google' && !process.env.GOOGLE_API_KEY) continue;

    for (let attempt = 0; attempt < 2; attempt++) {
      const start = Date.now();
      try {
        const res = await callProvider(cand.provider as Provider, cand.model, input.prompt, opts);
        const latencyMs = Date.now() - start;

        const stats = await db
          .select()
          .from(llmProviderStatsTable)
          .where(
            and(
              eq(llmProviderStatsTable.provider, cand.provider),
              eq(llmProviderStatsTable.model, cand.model)
            )
          )
          .limit(1);
        const stat = stats[0];
        
        const costIn = res.tokensInput ? Number(stat?.costPer1kInputUsd ?? 0) * (res.tokensInput / 1000) : 0;
        const costOut = res.tokensOutput ? Number(stat?.costPer1kOutputUsd ?? 0) * (res.tokensOutput / 1000) : 0;
        const costEstimate = (costIn + costOut).toFixed(6);

        await db.insert(llmUsageLogsTable).values({
          correlationId,
          userId: input.userId ?? null,
          subtaskId: input.subtaskId ?? null,
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

        await db
          .insert(llmProviderStatsTable)
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
            target: [llmProviderStatsTable.provider, llmProviderStatsTable.model],
            set: {
              updatedAt: new Date(),
              totalCalls: (stat?.totalCalls ?? 0) + 1,
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

        await db.insert(llmUsageLogsTable).values({
          correlationId,
          userId: input.userId ?? null,
          subtaskId: input.subtaskId ?? null,
          provider: cand.provider,
          model: cand.model,
          promptHash,
          status: err?.status === 429 ? 'rate_limited' : (err?.name === 'TimeoutError' ? 'timeout' : 'failure'),
          errorCode: String(err?.status ?? err?.code ?? 'ERR'),
          errorMessage: (err?.message ?? 'Unknown error').slice(0, 500),
          cacheHit: false,
        });

        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }

  throw new Error(`All provider attempts failed. Last error: ${(lastError?.message ?? 'Unknown')}`);
}
