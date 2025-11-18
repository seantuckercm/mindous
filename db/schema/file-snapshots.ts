
import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * File Snapshots Table
 * Stores file tree snapshots for each build/execution
 */
export const fileSnapshotsTable = pgTable("file_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  buildId: uuid("build_id").notNull(),
  filePath: text("file_path").notNull(),
  content: text("content"), // File content (for text files)
  size: integer("size"), // File size in bytes
  mimeType: text("mime_type"),
  isDirectory: boolean("is_directory").default(false).notNull(),
  parentPath: text("parent_path"), // For tree structure
  createdAt: timestamp("created_at").defaultNow().notNull(),
  modifiedAt: timestamp("modified_at").defaultNow().notNull()
});

export const fileSnapshotsRelations = relations(fileSnapshotsTable, ({ one }) => ({
  build: one("builds", {
    fields: [fileSnapshotsTable.buildId],
    references: ["id"]
  })
}));

export type InsertFileSnapshot = typeof fileSnapshotsTable.$inferInsert;
export type SelectFileSnapshot = typeof fileSnapshotsTable.$inferSelect;

