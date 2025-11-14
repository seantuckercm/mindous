
import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tasksTable } from "./tasks";
import { agentsTable } from "./agents";

export const executionStatusEnum = pgEnum("execution_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "timeout"
]);

export const executionsTable = pgTable("executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
  status: executionStatusEnum("status").notNull().default("queued"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  result: jsonb("result"), // Execution result data
  error: text("error"), // Error message if failed
  logs: jsonb("logs"), // Array of log entries
  metrics: jsonb("metrics"), // Performance metrics (tokens used, time taken, etc.)
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  // Indexes for common query patterns
  taskIdIdx: index("executions_task_id_idx").on(table.taskId),
  agentIdIdx: index("executions_agent_id_idx").on(table.agentId),
  statusIdx: index("executions_status_idx").on(table.status),
  createdAtIdx: index("executions_created_at_idx").on(table.createdAt)
}));

// Define relations
export const executionsRelations = relations(executionsTable, ({ one, many }) => ({
  task: one(tasksTable, {
    fields: [executionsTable.taskId],
    references: [tasksTable.id]
  }),
  agent: one(agentsTable, {
    fields: [executionsTable.agentId],
    references: [agentsTable.id]
  }),
  contexts: many("context")
}));

export type InsertExecution = typeof executionsTable.$inferInsert;
export type SelectExecution = typeof executionsTable.$inferSelect;

