
import { pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Clarifications Table
 * Stores clarification questions and user answers for agent executions
 */
export const clarificationsTable = pgTable("clarifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  executionId: uuid("execution_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options"), // Array of multiple choice options
  answer: text("answer"), // User's answer or auto-decided answer
  isAutoDecided: boolean("is_auto_decided").default(false).notNull(),
  category: text("category").notNull(), // 'technical', 'design', 'features', 'data'
  required: boolean("required").default(false).notNull(),
  explanation: text("explanation"), // Why this question matters
  defaultValue: text("default_value"), // Default value for auto-decide
  createdAt: timestamp("created_at").defaultNow().notNull(),
  answeredAt: timestamp("answered_at")
});

export const clarificationsRelations = relations(clarificationsTable, ({ one }) => ({
  execution: one("executions", {
    fields: [clarificationsTable.executionId],
    references: ["id"]
  })
}));

export type InsertClarification = typeof clarificationsTable.$inferInsert;
export type SelectClarification = typeof clarificationsTable.$inferSelect;

