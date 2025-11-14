
import { pgTable, text, timestamp, uuid, jsonb, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { executionsTable } from "./executions";

export const contextTable = pgTable("context", {
  id: uuid("id").primaryKey().defaultRandom(),
  executionId: uuid("execution_id").notNull().references(() => executionsTable.id, { onDelete: "cascade" }),
  contextType: text("context_type").notNull(), // e.g., "memory", "tool_output", "intermediate_result"
  contextData: jsonb("context_data").notNull(), // The actual context content
  metadata: jsonb("metadata"), // Additional metadata about the context
  sequenceNumber: integer("sequence_number"), // Order of context in execution
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  // Indexes for efficient context retrieval
  executionIdIdx: index("context_execution_id_idx").on(table.executionId),
  contextTypeIdx: index("context_type_idx").on(table.contextType),
  sequenceIdx: index("context_sequence_idx").on(table.executionId, table.sequenceNumber)
}));

// Define relations
export const contextRelations = relations(contextTable, ({ one }) => ({
  execution: one(executionsTable, {
    fields: [contextTable.executionId],
    references: [executionsTable.id]
  })
}));

export type InsertContext = typeof contextTable.$inferInsert;
export type SelectContext = typeof contextTable.$inferSelect;

