import { pgTable, uuid, text, boolean, integer, numeric, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Log every LLM call (success/failure)
export const llmUsageLogsTable = pgTable('llm_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  correlationId: uuid('correlation_id').notNull().defaultRandom(),
  userId: text('user_id'),
  subtaskId: uuid('subtask_id'),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  promptHash: text('prompt_hash').notNull(),
  status: text('status').notNull(),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  costEstimateUsd: numeric('cost_estimate_usd', { precision: 12, scale: 6 }),
  cacheHit: boolean('cache_hit').notNull().default(false),
  routedScore: jsonb('routed_score'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  providerIdx: index('llm_usage_logs_provider_idx').on(table.provider, table.model),
  subtaskIdx: index('llm_usage_logs_subtask_idx').on(table.subtaskId),
  promptIdx: index('llm_usage_logs_prompt_idx').on(table.promptHash),
}));

// Aggregated stats per provider+model
export const llmProviderStatsTable = pgTable('llm_provider_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  costPer1kInputUsd: numeric('cost_per_1k_input_usd', { precision: 10, scale: 6 }).notNull(),
  costPer1kOutputUsd: numeric('cost_per_1k_output_usd', { precision: 10, scale: 6 }).notNull(),
  latencyAvgMs: integer('latency_avg_ms').notNull().default(0),
  latencyP95Ms: integer('latency_p95_ms').notNull().default(0),
  successRate: numeric('success_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  totalCalls: integer('total_calls').notNull().default(0),
  errorRate: numeric('error_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  providerModelUnique: unique('llm_provider_stats_provider_model_unique').on(table.provider, table.model),
}));

// Result cache for repeated prompts
export const llmRouteCacheTable = pgTable('llm_route_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  scope: text('scope').notNull().default('system'),
  ownerId: text('owner_id'),
  promptHash: text('prompt_hash').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  response: jsonb('response').notNull(),
  tokensOutput: integer('tokens_output'),
  hitCount: integer('hit_count').notNull().default(0),
  lastHitAt: timestamp('last_hit_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueKey: unique('llm_route_cache_unique').on(table.scope, table.ownerId, table.promptHash),
  cacheIdx: index('llm_route_cache_idx').on(table.promptHash, table.expiresAt),
}));

// Circuit breaker state per provider+model
export const llmCircuitBreakersTable = pgTable('llm_circuit_breakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  state: text('state').notNull().default('closed'),
  failureCount: integer('failure_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  openedAt: timestamp('opened_at'),
  nextAttemptAt: timestamp('next_attempt_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueCB: unique('llm_circuit_breakers_unique').on(table.provider, table.model),
}));

export type InsertLlmUsageLog = typeof llmUsageLogsTable.$inferInsert;
export type SelectLlmUsageLog = typeof llmUsageLogsTable.$inferSelect;
export type InsertLlmProviderStats = typeof llmProviderStatsTable.$inferInsert;
export type SelectLlmProviderStats = typeof llmProviderStatsTable.$inferSelect;
export type InsertLlmRouteCache = typeof llmRouteCacheTable.$inferInsert;
export type SelectLlmRouteCache = typeof llmRouteCacheTable.$inferSelect;
export type InsertLlmCircuitBreaker = typeof llmCircuitBreakersTable.$inferInsert;
export type SelectLlmCircuitBreaker = typeof llmCircuitBreakersTable.$inferSelect;
