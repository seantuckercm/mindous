
import { pgTable, text, timestamp, uuid, jsonb, index, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { executionsTable } from "./executions";
import { runsTable } from "./progress-stream-schema";

// Execution state table - stores agent execution state for recovery and debugging
export const executionStateTable = pgTable("execution_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  executionId: uuid("execution_id").notNull().references(() => executionsTable.id, { onDelete: "cascade" }),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  currentStep: text("current_step").notNull(),
  stepIndex: integer("step_index").notNull(),
  totalSteps: integer("total_steps").notNull(),
  context: jsonb("context"), // Execution context variables
  variables: jsonb("variables"), // Runtime variables
  artifacts: jsonb("artifacts"), // Generated artifacts references
  decisions: jsonb("decisions"), // Agent decision history (array)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  executionIdIdx: index("execution_state_execution_id_idx").on(table.executionId),
  runIdIdx: index("execution_state_run_id_idx").on(table.runId)
}));

// Define relations
export const executionStateRelations = relations(executionStateTable, ({ one }) => ({
  execution: one(executionsTable, {
    fields: [executionStateTable.executionId],
    references: [executionsTable.id]
  }),
  run: one(runsTable, {
    fields: [executionStateTable.runId],
    references: [runsTable.id]
  })
}));

export type InsertExecutionState = typeof executionStateTable.$inferInsert;
export type SelectExecutionState = typeof executionStateTable.$inferSelect;
