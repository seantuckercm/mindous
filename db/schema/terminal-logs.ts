
import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const terminalOutputTypeEnum = pgEnum("terminal_output_type", [
  "command",
  "stdout", 
  "stderr",
  "exit"
]);

/**
 * Terminal Logs Table
 * Stores terminal output for build executions with command tracking
 */
export const terminalLogsTable = pgTable("terminal_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  buildId: uuid("build_id").notNull(),
  executionId: uuid("execution_id").notNull(),
  type: terminalOutputTypeEnum("type").notNull(),
  content: text("content").notNull(), // Command, output, or error message
  exitCode: integer("exit_code"), // For exit type
  duration: integer("duration"), // Command duration in milliseconds
  sequence: integer("sequence").notNull(), // Order of output
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const terminalLogsRelations = relations(terminalLogsTable, ({ one }) => ({
  build: one("builds", {
    fields: [terminalLogsTable.buildId],
    references: ["id"]
  }),
  execution: one("executions", {
    fields: [terminalLogsTable.executionId],
    references: ["id"]
  })
}));

export type InsertTerminalLog = typeof terminalLogsTable.$inferInsert;
export type SelectTerminalLog = typeof terminalLogsTable.$inferSelect;

