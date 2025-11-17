import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { executionsTable } from "./executions";

// Run status enum
export const runStatusEnum = pgEnum("run_status", [
  "queued",
  "starting",
  "running",
  "paused",
  "resuming",
  "completed",
  "failed",
  "cancelled"
]);

// Subtask status enum
export const subtaskStatusEnum = pgEnum("subtask_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "skipped"
]);

// Event type enum
export const eventTypeEnum = pgEnum("event_type", [
  "RUN_STARTED",
  "RUN_PROGRESS",
  "RUN_PAUSED",
  "RUN_RESUMED",
  "RUN_COMPLETED",
  "RUN_FAILED",
  "RUN_CANCELLED",
  "RUN_ERROR",
  "SUBTASK_CREATED",
  "SUBTASK_STARTED",
  "SUBTASK_PROGRESS",
  "SUBTASK_COMPLETED",
  "SUBTASK_FAILED",
  "SUBTASK_SKIPPED",
  "ARTIFACT_CREATED",
  "ARTIFACT_UPDATED",
  "LOG_MESSAGE"
]);

// Runs table - tracks overall execution runs
export const runsTable = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  executionId: uuid("execution_id").notNull().references(() => executionsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  status: runStatusEnum("status").notNull().default("queued"),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").default(0), // 0-100 percentage
  currentStep: text("current_step"),
  totalSteps: integer("total_steps").default(0),
  completedSteps: integer("completed_steps").default(0),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  pausedAt: timestamp("paused_at"),
  resumedAt: timestamp("resumed_at"),
  metadata: jsonb("metadata"), // Additional context data
  error: text("error"), // Error message if failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  executionIdIdx: index("runs_execution_id_idx").on(table.executionId),
  userIdIdx: index("runs_user_id_idx").on(table.userId),
  statusIdx: index("runs_status_idx").on(table.status),
  createdAtIdx: index("runs_created_at_idx").on(table.createdAt)
}));

// Run subtasks table - individual steps within a run
export const runSubtasksTable = pgTable("run_subtasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  parentSubtaskId: uuid("parent_subtask_id"), // For nested subtasks
  title: text("title").notNull(),
  description: text("description"),
  status: subtaskStatusEnum("status").notNull().default("pending"),
  order: integer("order").notNull(), // Execution order
  progress: integer("progress").default(0), // 0-100 percentage
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in milliseconds
  result: jsonb("result"), // Result data
  error: text("error"), // Error message if failed
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  runIdIdx: index("run_subtasks_run_id_idx").on(table.runId),
  parentSubtaskIdIdx: index("run_subtasks_parent_subtask_id_idx").on(table.parentSubtaskId),
  statusIdx: index("run_subtasks_status_idx").on(table.status),
  orderIdx: index("run_subtasks_order_idx").on(table.order)
}));

// Run events table - streaming events for real-time updates
export const runEventsTable = pgTable("run_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  subtaskId: uuid("subtask_id").references(() => runSubtasksTable.id, { onDelete: "cascade" }),
  eventType: eventTypeEnum("event_type").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Event payload data
  timestamp: timestamp("timestamp").defaultNow().notNull()
}, (table) => ({
  runIdIdx: index("run_events_run_id_idx").on(table.runId),
  subtaskIdIdx: index("run_events_subtask_id_idx").on(table.subtaskId),
  eventTypeIdx: index("run_events_event_type_idx").on(table.eventType),
  timestampIdx: index("run_events_timestamp_idx").on(table.timestamp)
}));

// Run artifacts table - files and outputs generated during run
export const runArtifactsTable = pgTable("run_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  subtaskId: uuid("subtask_id").references(() => runSubtasksTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // file, code, image, document, etc.
  path: text("path"), // Storage path or URL
  content: text("content"), // For inline content (code snippets, etc.)
  size: integer("size"), // File size in bytes
  mimeType: text("mime_type"),
  metadata: jsonb("metadata"), // Additional artifact metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  runIdIdx: index("run_artifacts_run_id_idx").on(table.runId),
  subtaskIdIdx: index("run_artifacts_subtask_id_idx").on(table.subtaskId),
  typeIdx: index("run_artifacts_type_idx").on(table.type),
  createdAtIdx: index("run_artifacts_created_at_idx").on(table.createdAt)
}));

// Define relations
export const runsRelations = relations(runsTable, ({ one, many }) => ({
  execution: one(executionsTable, {
    fields: [runsTable.executionId],
    references: [executionsTable.id]
  }),
  subtasks: many(runSubtasksTable),
  events: many(runEventsTable),
  artifacts: many(runArtifactsTable)
}));

export const runSubtasksRelations = relations(runSubtasksTable, ({ one, many }) => ({
  run: one(runsTable, {
    fields: [runSubtasksTable.runId],
    references: [runsTable.id]
  }),
  parent: one(runSubtasksTable, {
    fields: [runSubtasksTable.parentSubtaskId],
    references: [runSubtasksTable.id],
    relationName: "subtask_children"
  }),
  children: many(runSubtasksTable, {
    relationName: "subtask_children"
  }),
  events: many(runEventsTable),
  artifacts: many(runArtifactsTable)
}));

export const runEventsRelations = relations(runEventsTable, ({ one }) => ({
  run: one(runsTable, {
    fields: [runEventsTable.runId],
    references: [runsTable.id]
  }),
  subtask: one(runSubtasksTable, {
    fields: [runEventsTable.subtaskId],
    references: [runSubtasksTable.id]
  })
}));

export const runArtifactsRelations = relations(runArtifactsTable, ({ one }) => ({
  run: one(runsTable, {
    fields: [runArtifactsTable.runId],
    references: [runsTable.id]
  }),
  subtask: one(runSubtasksTable, {
    fields: [runArtifactsTable.subtaskId],
    references: [runArtifactsTable.id]
  })
}));

// Export types
export type InsertRun = typeof runsTable.$inferInsert;
export type SelectRun = typeof runsTable.$inferSelect;
export type InsertRunSubtask = typeof runSubtasksTable.$inferInsert;
export type SelectRunSubtask = typeof runSubtasksTable.$inferSelect;
export type InsertRunEvent = typeof runEventsTable.$inferInsert;
export type SelectRunEvent = typeof runEventsTable.$inferSelect;
export type InsertRunArtifact = typeof runArtifactsTable.$inferInsert;
export type SelectRunArtifact = typeof runArtifactsTable.$inferSelect;
