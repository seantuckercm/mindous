import crypto from 'crypto';
import { db } from '@/db';
import { and, eq, lt } from 'drizzle-orm';
import { llmRouteCacheTable } from '@/db/schema/llm-routing';

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
    .from(llmRouteCacheTable)
    .where(
      and(
        eq(llmRouteCacheTable.scope, scope),
        eq(llmRouteCacheTable.ownerId, ownerId ?? null),
        eq(llmRouteCacheTable.promptHash, promptHash),
        lt(llmRouteCacheTable.expiresAt, new Date('9999-12-31'))
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;
  await db
    .update(llmRouteCacheTable)
    .set({ hitCount: (row.hitCount ?? 0) + 1, lastHitAt: new Date(now) })
    .where(eq(llmRouteCacheTable.id, row.id));
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
  const expiresAt = new Date(Date.now() + entry.ttlSeconds * 1000);
  await db
    .insert(llmRouteCacheTable)
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
      target: [llmRouteCacheTable.scope, llmRouteCacheTable.ownerId, llmRouteCacheTable.promptHash],
      set: {
        provider: entry.provider,
        model: entry.model,
        response: entry.response,
        tokensOutput: entry.tokensOutput ?? null,
        expiresAt,
      },
    });
}
