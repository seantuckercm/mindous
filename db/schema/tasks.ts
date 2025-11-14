
import { pgTable, text, timestamp, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress", 
  "completed",
  "failed",
  "cancelled"
]);

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  parentTaskId: uuid("parent_task_id"),
  metadata: jsonb("metadata"), // Store additional task context and parameters
  result: jsonb("result"), // Store task execution results
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

// Define relations
export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  // Self-referencing relation for parent-child tasks
  parent: one(tasksTable, {
    fields: [tasksTable.parentTaskId],
    references: [tasksTable.id],
    relationName: "task_subtasks"
  }),
  subtasks: many(tasksTable, {
    relationName: "task_subtasks"
  }),
  // One-to-many relation with executions
  executions: many("executions")
}));

export type InsertTask = typeof tasksTable.$inferInsert;
export type SelectTask = typeof tasksTable.$inferSelect;

