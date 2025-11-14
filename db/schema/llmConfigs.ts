
import { pgTable, text, timestamp, uuid, jsonb, pgEnum, boolean, integer, index } from "drizzle-orm/pg-core";

export const llmProviderEnum = pgEnum("llm_provider", [
  "openai",
  "anthropic",
  "google",
  "azure",
  "custom"
]);

export const llmConfigsTable = pgTable("llm_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"), // Optional: for user-specific configs
  name: text("name").notNull(),
  provider: llmProviderEnum("provider").notNull(),
  model: text("model").notNull(), // e.g., "gpt-4", "claude-3-opus"
  apiKey: text("api_key"), // Encrypted API key
  endpoint: text("endpoint"), // Custom endpoint URL
  routingRules: jsonb("routing_rules"), // Rules for when to use this config
  parameters: jsonb("parameters"), // Model parameters (temperature, max_tokens, etc.)
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority configs used first
  rateLimit: jsonb("rate_limit"), // Rate limiting configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => ({
  // Indexes for efficient querying
  providerIdx: index("llm_configs_provider_idx").on(table.provider),
  userIdIdx: index("llm_configs_user_id_idx").on(table.userId),
  isActiveIdx: index("llm_configs_is_active_idx").on(table.isActive),
  priorityIdx: index("llm_configs_priority_idx").on(table.priority)
}));

export type InsertLlmConfig = typeof llmConfigsTable.$inferInsert;
export type SelectLlmConfig = typeof llmConfigsTable.$inferSelect;

