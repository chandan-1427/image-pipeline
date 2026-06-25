import { db, batches, imageRuns } from "@image-pipeline/db";
import { eq } from "drizzle-orm";

export async function createBatch(totalImages: number) {
  const [batch] = await db.insert(batches).values({ totalImages }).returning();
  return batch;
}

export async function createImageRun(values: {
  batchId: string;
  sourcePath: string;
  sourceFormat: "jpg" | "jpeg" | "png" | "webp" | "gif" | "bmp";
  targetFormat: "jpg" | "jpeg" | "png" | "webp" | "gif" | "bmp";
}) {
  const [run] = await db.insert(imageRuns).values(values).returning();
  return run;
}

export async function updateImageRun(
  imageRunId: string,
  values: Partial<{
    status: "QUEUED" | "DOWNLOADING" | "CONVERTING" | "UPLOADING" | "DONE" | "FAILED";
    progressPercent: number;
    resultPath: string;
    error: string;
    startedAt: Date;
    completedAt: Date;
  }>
) {
  await db.update(imageRuns).set(values).where(eq(imageRuns.id, imageRunId));
}

export async function completeBatch(batchId: string) {
  await db
    .update(batches)
    .set({ status: "COMPLETED", completedAt: new Date() })
    .where(eq(batches.id, batchId));
}