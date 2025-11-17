
import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { runsTable, runSubtasksTable } from "./progress-stream-schema";

// Validation status enum
export const validationStatusEnum = pgEnum("validation_status", [
  "valid",
  "invalid",
  "unchecked"
]);

// Code generations table - tracks individual code generation requests
export const codeGenerationsTable = pgTable("code_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  subtaskId: uuid("subtask_id").references(() => runSubtasksTable.id, { onDelete: "set null" }),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(), // What to generate
  generatedCode: text("generated_code").notNull(),
  language: text("language").notNull(), // typescript, javascript, css, etc
  framework: text("framework"), // react, nextjs, etc
  llmProvider: text("llm_provider").notNull(),
  llmModel: text("llm_model").notNull(),
  tokensUsed: integer("tokens_used"),
  generationTimeMs: integer("generation_time_ms"),
  validationStatus: validationStatusEnum("validation_status").default("unchecked"),
  validationErrors: jsonb("validation_errors"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  runIdIdx: index("code_generations_run_id_idx").on(table.runId),
  subtaskIdIdx: index("code_generations_subtask_id_idx").on(table.subtaskId),
  userIdIdx: index("code_generations_user_id_idx").on(table.userId),
  createdAtIdx: index("code_generations_created_at_idx").on(table.createdAt)
}));

// Define relations
export const codeGenerationsRelations = relations(codeGenerationsTable, ({ one }) => ({
  run: one(runsTable, {
    fields: [codeGenerationsTable.runId],
    references: [runsTable.id]
  }),
  subtask: one(runSubtasksTable, {
    fields: [codeGenerationsTable.subtaskId],
    references: [runSubtasksTable.id]
  })
}));

export type InsertCodeGeneration = typeof codeGenerationsTable.$inferInsert;
export type SelectCodeGeneration = typeof codeGenerationsTable.$inferSelect;
