"use client";

import { useState } from "react";
import { UploadForm } from "../components/UploadForm";
import { BatchProgress } from "../components/BatchProgress";
import { useSSE } from "../hooks/useSSE";
import { BatchState, SSEEvent, ImageRunStatus } from "../types/index";

export default function Home() {
  const [batch, setBatch] = useState<BatchState | null>(null);

  const handleBatchStart = (
    batchId: string,
    imageRuns: { imageRunId: string; fileName: string; targetFormat: string }[]
  ) => {
    setBatch({
      batchId,
      completed: false,
      imageRuns: imageRuns.map((r) => ({
        ...r,
        status: "QUEUED",
        progressPercent: 0,
      })),
    });
  };

  const handleSSEEvent = (event: SSEEvent) => {
    setBatch((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        imageRuns: prev.imageRuns.map((run) =>
          run.imageRunId === event.imageRunId
            ? {
                ...run,
                status: event.status as ImageRunStatus,
                progressPercent: event.progressPercent,
                resultPath: event.resultPath ?? run.resultPath,
                error: event.error ?? run.error,
              }
            : run
        ),
      };
    });
  };

  const handleDone = () => {
    setBatch((prev) => (prev ? { ...prev, completed: true } : prev));
  };

  useSSE(batch?.batchId ?? null, handleSSEEvent, handleDone);

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Image Pipeline</h1>
          <p className="text-zinc-500 text-sm">
            Upload up to 5 images and convert them to your target format.
          </p>
        </div>

        <UploadForm
          onBatchStart={handleBatchStart}
          disabled={!!batch && !batch.completed}
        />

        {batch && <BatchProgress batch={batch} />}
      </div>
    </main>
  );
}