
import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const agentTypeEnum = pgEnum("agent_type", [
  "planner",
  "researcher",
  "coder",
  "reviewer",
  "executor",
  "custom"
]);

export const agentsTable = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: agentTypeEnum("type").notNull(),
  description: text("description"),
  capabilities: jsonb("capabilities").notNull(), // Array of capabilities
  config: jsonb("config").notNull(), // Agent-specific configuration
  systemPrompt: text("system_prompt"), // Custom system prompt for the agent
  isActive: text("is_active").default("true"), // Whether agent is available for use
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  // Index for faster lookups by type
  typeIdx: index("agents_type_idx").on(table.type),
  nameIdx: index("agents_name_idx").on(table.name)
}));

// Define relations
export const agentsRelations = relations(agentsTable, ({ many }) => ({
  executions: many("executions")
}));

export type InsertAgent = typeof agentsTable.$inferInsert;
export type SelectAgent = typeof agentsTable.$inferSelect;

