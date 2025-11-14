import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { llmCircuitBreakersTable } from '@/db/schema/llm-routing';

const FAILURE_THRESHOLD = 5;
const COOL_DOWN_MS = 60_000;

export async function getCircuitState(provider: string, model: string) {
  const rows = await db
    .select()
    .from(llmCircuitBreakersTable)
    .where(
      and(
        eq(llmCircuitBreakersTable.provider, provider),
        eq(llmCircuitBreakersTable.model, model)
      )
    )
    .limit(1);
  return rows[0];
}

export async function recordSuccess(provider: string, model: string) {
  const now = new Date();
  await db
    .insert(llmCircuitBreakersTable)
    .values({
      provider,
      model,
      state: 'closed',
      successCount: 1,
      failureCount: 0,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [llmCircuitBreakersTable.provider, llmCircuitBreakersTable.model],
      set: {
        state: 'closed',
        successCount: 0,
        failureCount: 0,
        updatedAt: now,
        openedAt: null,
        nextAttemptAt: null,
      },
    });
}

export async function recordFailure(provider: string, model: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(llmCircuitBreakersTable)
    .where(
      and(
        eq(llmCircuitBreakersTable.provider, provider),
        eq(llmCircuitBreakersTable.model, model)
      )
    )
    .limit(1);
  const row = rows[0];
  const failures = (row?.failureCount ?? 0) + 1;
  const open = failures >= FAILURE_THRESHOLD;
  const update: any = {
    failureCount: failures,
    updatedAt: now,
  };
  if (open) {
    update.state = 'open';
    update.openedAt = now;
    update.nextAttemptAt = new Date(now.getTime() + COOL_DOWN_MS);
  }
  await db
    .insert(llmCircuitBreakersTable)
    .values({
      provider,
      model,
      state: open ? 'open' : 'closed',
      failureCount: failures,
      updatedAt: now,
      openedAt: open ? now : null,
      nextAttemptAt: open ? new Date(now.getTime() + COOL_DOWN_MS) : null,
    })
    .onConflictDoUpdate({
      target: [llmCircuitBreakersTable.provider, llmCircuitBreakersTable.model],
      set: update,
    });
}

export function isAvailable(row?: { state?: string; nextAttemptAt?: Date | null }) {
  if (!row) return true;
  if (row.state === 'open' && row.nextAttemptAt) {
    return new Date(row.nextAttemptAt) < new Date();
  }
  return row.state !== 'open';
}
