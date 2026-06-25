import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  integer,
  timestamp,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Rolled-up status for a whole batch (derived from its image_runs)
export const batchStatusEnum = pgEnum("batch_status", [
  "IN_PROGRESS",
  "COMPLETED",
]);

// Per-image conversion lifecycle (coarse states; live % lives in progressPercent)
export const imageRunStatusEnum = pgEnum("image_run_status", [
  "QUEUED",
  "DOWNLOADING",
  "CONVERTING",
  "UPLOADING",
  "DONE",
  "FAILED",
]);

export const supportedFormatEnum = pgEnum("supported_format", [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
]);

// One row per "Convert" click. Parent of N image_runs.
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: batchStatusEnum("status").notNull().default("IN_PROGRESS"),
  totalImages: integer("total_images").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// One row per image within a batch. Independent of sibling rows.
export const imageRuns = pgTable(
  "image_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    sourcePath: text("source_path").notNull(),
    sourceFormat: supportedFormatEnum("source_format").notNull(),
    targetFormat: supportedFormatEnum("target_format").notNull(),
    status: imageRunStatusEnum("status").notNull().default("QUEUED"),
    progressPercent: integer("progress_percent").notNull().default(0),
    resultPath: text("result_path"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    batchIdIdx: index("image_runs_batch_id_idx").on(table.batchId),
  })
);

// Lets Drizzle do db.query.batches.findFirst({ with: { imageRuns: true } })
export const batchesRelations = relations(batches, ({ many }) => ({
  imageRuns: many(imageRuns),
}));

export const imageRunsRelations = relations(imageRuns, ({ one }) => ({
  batch: one(batches, {
    fields: [imageRuns.batchId],
    references: [batches.id],
  }),
}));