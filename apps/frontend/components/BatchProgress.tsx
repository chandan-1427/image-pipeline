"use client";

import { BatchState } from "../types/index";
import { ImageRunCard } from "./ImageRunCard";

export function BatchProgress({ batch }: { batch: BatchState }) {
  const total = batch.imageRuns.length;
  const done = batch.imageRuns.filter((r) => r.status === "DONE").length;
  const failed = batch.imageRuns.filter((r) => r.status === "FAILED").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">
          Batch Progress
        </h2>
        <span className="text-xs text-zinc-500">
          {done + failed}/{total} complete
          {failed > 0 && (
            <span className="text-red-400 ml-2">{failed} failed</span>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {batch.imageRuns.map((run) => (
          <ImageRunCard key={run.imageRunId} run={run} />
        ))}
      </div>

      {batch.completed && (
        <p className="text-center text-sm text-green-400 font-medium mt-2">
          All conversions complete
        </p>
      )}
    </div>
  );
}