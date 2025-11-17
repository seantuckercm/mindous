
import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index, integer, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { runsTable } from "./progress-stream-schema";
import { executionsTable } from "./executions";

// Build status enum
export const buildStatusEnum = pgEnum("build_status", [
  "queued",
  "installing",
  "building",
  "completed",
  "failed",
  "cancelled"
]);

// Project type enum
export const projectTypeEnum = pgEnum("project_type", [
  "nextjs",
  "react",
  "html",
  "nodejs",
  "other"
]);

// Builds table - tracks build operations for generated projects
export const buildsTable = pgTable("builds", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  executionId: uuid("execution_id").references(() => executionsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  projectName: text("project_name").notNull(),
  projectType: projectTypeEnum("project_type").notNull(),
  status: buildStatusEnum("status").notNull().default("queued"),
  buildPath: text("build_path"), // File system path
  outputPath: text("output_path"), // Build output path (.next, dist, etc)
  buildLogs: text("build_logs"), // Build logs
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  metadata: jsonb("metadata"), // Project specs, dependencies, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  runIdIdx: index("builds_run_id_idx").on(table.runId),
  executionIdIdx: index("builds_execution_id_idx").on(table.executionId),
  userIdIdx: index("builds_user_id_idx").on(table.userId),
  statusIdx: index("builds_status_idx").on(table.status),
  createdAtIdx: index("builds_created_at_idx").on(table.createdAt)
}));

// Build artifacts table - stores generated code files and assets
export const buildArtifactsTable = pgTable("build_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  buildId: uuid("build_id").notNull().references(() => buildsTable.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(), // Relative path in project
  fileType: text("file_type").notNull(), // tsx, ts, css, json, etc
  content: text("content"), // File content (for small files)
  storagePath: text("storage_path"), // Supabase storage path (for large files)
  sizeBytes: integer("size_bytes"),
  mimeType: text("mime_type"),
  isGenerated: integer("is_generated").default(1), // Using integer for boolean (1 = true, 0 = false)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  buildIdIdx: index("build_artifacts_build_id_idx").on(table.buildId),
  fileTypeIdx: index("build_artifacts_file_type_idx").on(table.fileType)
}));

// Define relations
export const buildsRelations = relations(buildsTable, ({ one, many }) => ({
  run: one(runsTable, {
    fields: [buildsTable.runId],
    references: [runsTable.id]
  }),
  execution: one(executionsTable, {
    fields: [buildsTable.executionId],
    references: [executionsTable.id]
  }),
  artifacts: many(buildArtifactsTable)
}));

export const buildArtifactsRelations = relations(buildArtifactsTable, ({ one }) => ({
  build: one(buildsTable, {
    fields: [buildArtifactsTable.buildId],
    references: [buildsTable.id]
  })
}));

export type InsertBuild = typeof buildsTable.$inferInsert;
export type SelectBuild = typeof buildsTable.$inferSelect;
export type InsertBuildArtifact = typeof buildArtifactsTable.$inferInsert;
export type SelectBuildArtifact = typeof buildArtifactsTable.$inferSelect;
