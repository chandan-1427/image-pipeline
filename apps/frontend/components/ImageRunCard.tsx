"use client";

import { ImageRunState } from "../types/index";

const STATUS_LABELS: Record<string, string> = {
  QUEUED: "Queued",
  DOWNLOADING: "Downloading",
  CONVERTING: "Converting",
  UPLOADING: "Uploading",
  DONE: "Done",
  FAILED: "Failed",
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "bg-zinc-600",
  DOWNLOADING: "bg-blue-500",
  CONVERTING: "bg-yellow-500",
  UPLOADING: "bg-purple-500",
  DONE: "bg-green-500",
  FAILED: "bg-red-500",
};

export function ImageRunCard({ run }: { run: ImageRunState }) {
  const color = STATUS_COLORS[run.status] ?? "bg-zinc-600";
  const label = STATUS_LABELS[run.status] ?? run.status;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200 truncate max-w-[60%]">
          {run.fileName}
        </span>
        <span className="text-xs text-zinc-400">
          → <span className="uppercase font-semibold text-zinc-300">{run.targetFormat}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${color}`}>
          {label}
        </span>
        <span className="text-xs text-zinc-400 ml-auto">{run.progressPercent}%</span>
      </div>

      <div className="w-full bg-zinc-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${run.progressPercent}%` }}
        />
      </div>

      {run.status === "DONE" && run.resultPath && (
        <a
          href={run.resultPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 underline mt-1"
        >
          Download converted image
        </a>
      )}

      {run.status === "FAILED" && run.error && (
        <p className="text-xs text-red-400 mt-1">{run.error}</p>
      )}
    </div>
  );
}