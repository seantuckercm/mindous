
import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { runsTable } from "./progress-stream-schema";
import { buildsTable } from "./builds";

// Preview deployment status enum
export const previewStatusEnum = pgEnum("preview_status", [
  "starting",
  "running",
  "stopped",
  "failed"
]);

// Preview deployments table - tracks preview environments for generated apps
export const previewDeploymentsTable = pgTable("preview_deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runsTable.id, { onDelete: "cascade" }),
  buildId: uuid("build_id").notNull().references(() => buildsTable.id, { onDelete: "cascade" }),
  previewUrl: text("preview_url").notNull(),
  internalPort: integer("internal_port").notNull(),
  status: previewStatusEnum("status").notNull().default("starting"),
  processId: text("process_id"), // PID or container ID
  startedAt: timestamp("started_at"),
  stoppedAt: timestamp("stopped_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  metadata: jsonb("metadata"), // Additional preview configuration
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  runIdIdx: index("preview_deployments_run_id_idx").on(table.runId),
  buildIdIdx: index("preview_deployments_build_id_idx").on(table.buildId),
  statusIdx: index("preview_deployments_status_idx").on(table.status),
  createdAtIdx: index("preview_deployments_created_at_idx").on(table.createdAt)
}));

// Define relations
export const previewDeploymentsRelations = relations(previewDeploymentsTable, ({ one }) => ({
  run: one(runsTable, {
    fields: [previewDeploymentsTable.runId],
    references: [runsTable.id]
  }),
  build: one(buildsTable, {
    fields: [previewDeploymentsTable.buildId],
    references: [buildsTable.id]
  })
}));

export type InsertPreviewDeployment = typeof previewDeploymentsTable.$inferInsert;
export type SelectPreviewDeployment = typeof previewDeploymentsTable.$inferSelect;
