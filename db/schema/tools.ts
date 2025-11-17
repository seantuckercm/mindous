import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  numeric
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { executionsTable } from './executions';

// Enums
export const toolRunStatusEnum = pgEnum('tool_run_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'timed_out',
  'canceled'
]);

// Tool Registry Table
export const toolsTable = pgTable('tools', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (t) => ({
  workspaceIdx: index('tools_workspace_idx').on(t.workspaceId),
  uniqueKey: index('tools_workspace_key_idx').on(t.workspaceId, t.key),
  activeIdx: index('tools_active_idx').on(t.active)
}));

// Tool Runs Table
export const toolRunsTable = pgTable('tool_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  executionId: uuid('execution_id').notNull().references(() => executionsTable.id, { onDelete: 'cascade' }),
  toolId: uuid('tool_id').notNull().references(() => toolsTable.id),
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (t) => ({
  workspaceIdx: index('tool_runs_workspace_idx').on(t.workspaceId),
  executionIdx: index('tool_runs_execution_idx').on(t.executionId),
  toolIdx: index('tool_runs_tool_idx').on(t.toolId),
  statusIdx: index('tool_runs_status_idx').on(t.status),
  createdAtIdx: index('tool_runs_created_at_idx').on(t.createdAt)
}));

// Tool Run Events (Logs) Table
export const toolRunEventsTable = pgTable('tool_run_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolRunId: uuid('tool_run_id').notNull().references(() => toolRunsTable.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull(),
  ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  level: text('level').notNull().default('info'), // info|warn|error|debug
  message: text('message').notNull(),
  data: jsonb('data'),
}, (t) => ({
  runIdx: index('tool_run_events_run_idx').on(t.toolRunId),
  tsIdx: index('tool_run_events_ts_idx').on(t.ts)
}));

// Tool Artifacts Table
export const toolArtifactsTable = pgTable('tool_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolRunId: uuid('tool_run_id').notNull().references(() => toolRunsTable.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  // Supabase Storage path (e.g., "tool-artifacts/{workspaceId}/{runId}/{filename}")
  storagePath: text('storage_path').notNull(),
  checksum: text('checksum'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  runIdx: index('tool_artifacts_run_idx').on(t.toolRunId),
  workspaceIdx: index('tool_artifacts_workspace_idx').on(t.workspaceId)
}));

// Relations
export const toolsRelations = relations(toolsTable, ({ many }) => ({
  runs: many(toolRunsTable),
}));

export const toolRunsRelations = relations(toolRunsTable, ({ one, many }) => ({
  tool: one(toolsTable, {
    fields: [toolRunsTable.toolId],
    references: [toolsTable.id]
  }),
  execution: one(executionsTable, {
    fields: [toolRunsTable.executionId],
    references: [executionsTable.id]
  }),
  events: many(toolRunEventsTable),
  artifacts: many(toolArtifactsTable),
}));

export const toolRunEventsRelations = relations(toolRunEventsTable, ({ one }) => ({
  toolRun: one(toolRunsTable, {
    fields: [toolRunEventsTable.toolRunId],
    references: [toolRunsTable.id]
  }),
}));

export const toolArtifactsRelations = relations(toolArtifactsTable, ({ one }) => ({
  toolRun: one(toolRunsTable, {
    fields: [toolArtifactsTable.toolRunId],
    references: [toolRunsTable.id]
  }),
}));

// Type exports
export type InsertTool = typeof toolsTable.$inferInsert;
export type SelectTool = typeof toolsTable.$inferSelect;
export type InsertToolRun = typeof toolRunsTable.$inferInsert;
export type SelectToolRun = typeof toolRunsTable.$inferSelect;
export type InsertToolRunEvent = typeof toolRunEventsTable.$inferInsert;
export type SelectToolRunEvent = typeof toolRunEventsTable.$inferSelect;
export type InsertToolArtifact = typeof toolArtifactsTable.$inferInsert;
export type SelectToolArtifact = typeof toolArtifactsTable.$inferSelect;

// Tool Manifest Type Definition
export type ToolManifest = {
  key: string;
  version: string;
  description?: string;
  inputSchema: Record<string, any>;  // JSON Schema v7
  outputSchema: Record<string, any>; // JSON Schema v7
  resources: {
    cpuShares?: number;
    memMb?: number;
    timeoutSec: number;
    diskQuotaMb?: number;
  };
  container: {
    image: string;
    cmd: string[];
    argsTemplate: string[];
    envVars?: string[];
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
