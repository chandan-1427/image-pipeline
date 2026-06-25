import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { engineClient } from "../grpc/engine.js";
import { uploadSourceImage } from "../storage.js";
import { createSSEStream } from "../sse.js";
import {
  createBatch,
  createImageRun,
  updateImageRun,
  completeBatch,
} from "../db/writes.js";
import { ProgressEvent, ImageRunStatus, ImageFormat } from "@image-pipeline/proto";

// In-memory store of batch image requests pending streaming
const pendingBatches = new Map<string, Array<{
  imageRunId: string;
  sourcePath: string;
  sourceFormat: string;
  targetFormat: string;
}>>();

const batch = new Hono();

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
};

// POST /api/batch
batch.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("images") as File[];
    const targetFormats = JSON.parse(
      formData.get("targetFormats") as string
    ) as string[];

    if (!files || files.length === 0) {
      return c.json({ error: "No files uploaded" }, 400);
    }

    // Create batch in DB
    const batchRecord = await createBatch(files.length);

    // Upload each file to Supabase and create image_run rows
    const imageRequests = await Promise.all(
      files.map(async (file, i) => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const sourcePath = `${batchRecord.id}/${uuidv4()}.${ext}`;
        const targetFormat = (targetFormats[i] ?? ext) as keyof typeof ImageFormat;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await uploadSourceImage(buffer, sourcePath, MIME_TYPES[ext] ?? "image/jpeg");

        const run = await createImageRun({
          batchId: batchRecord.id,
          sourcePath,
          sourceFormat: ext as "jpg" | "jpeg" | "png" | "webp" | "gif" | "bmp",
          targetFormat: targetFormat as "jpg" | "jpeg" | "png" | "webp" | "gif" | "bmp",
        });

        return {
          imageRunId: run.id,
          sourcePath,
          sourceFormat: ext as keyof typeof ImageFormat,
          targetFormat,
        };
      })
    );

    pendingBatches.set(batchRecord.id, imageRequests);

    return c.json({ batchId: batchRecord.id, imageRuns: imageRequests.map(r => r.imageRunId) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/batch error:", message);
    return c.json({ error: message }, 500);
  }
});

// GET /api/batch/:id/stream
batch.get("/:id/stream", async (c) => {
  const batchId = c.req.param("id");

  return createSSEStream(c, async (send) => {
    await new Promise<void>((resolve, reject) => {
      const imageRequests = pendingBatches.get(batchId) ?? [];
      pendingBatches.delete(batchId); // clean up after use

      const engineStream = engineClient.convertBatch({
        batchId,
        images: imageRequests.map((r) => ({
          imageRunId: r.imageRunId,
          sourcePath: r.sourcePath,
          sourceFormat: r.sourceFormat as keyof typeof ImageFormat,
          targetFormat: r.targetFormat as keyof typeof ImageFormat,
        })),
      });

      engineStream.on("data", async (event: ProgressEvent) => {
        // Update DB
        const isTerminal =
          event.status === ImageRunStatus.DONE ||
          event.status === ImageRunStatus.FAILED;

        await updateImageRun(event.imageRunId, {
          status: event.status as any,
          progressPercent: event.progressPercent,
          ...(event.status === ImageRunStatus.DOWNLOADING && !event.progressPercent
            ? { startedAt: new Date() }
            : {}),
          ...(isTerminal ? { completedAt: new Date() } : {}),
          ...(event.resultPath ? { resultPath: event.resultPath } : {}),
          ...(event.error ? { error: event.error } : {}),
        });

        // Send SSE
        await send({
          imageRunId: event.imageRunId,
          status: event.status,
          progressPercent: event.progressPercent,
          ...(event.resultPath ? { resultPath: event.resultPath } : {}),
          ...(event.error ? { error: event.error } : {}),
        });
      });

      engineStream.on("error", async (err: Error) => {
        console.error(`Engine stream error for batch ${batchId}:`, err.message);
        await send({ imageRunId: "", status: "ERROR", progressPercent: 0, error: err.message });
        reject(err);
      });

      engineStream.on("end", async () => {
        await completeBatch(batchId);
        await send({ imageRunId: "", status: "BATCH_DONE", progressPercent: 100, type: "DONE" });
        resolve();
      });
    });
  });
});

export default batch;