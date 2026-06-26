"use client";

import { useRef, useState } from "react";

const FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

type FileEntry = {
  file: File;
  targetFormat: string;
};

type Props = {
  onBatchStart: (
    batchId: string,
    imageRuns: { imageRunId: string; fileName: string; targetFormat: string }[]
  ) => void;
  disabled: boolean;
};

export function UploadForm({ onBatchStart, disabled }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setEntries(
      files.map((file) => ({
        file,
        targetFormat: "webp",
      }))
    );
  };

  const handleFormatChange = (index: number, format: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, targetFormat: format } : e))
    );
  };

  const handleSubmit = async () => {
    if (entries.length === 0) return;
    setLoading(true);

    try {
      const formData = new FormData();
      entries.forEach((e) => formData.append("images", e.file));
      formData.append(
        "targetFormats",
        JSON.stringify(entries.map((e) => e.targetFormat))
      );

      const res = await fetch("http://localhost:4000/api/batch", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      onBatchStart(
        data.batchId,
        data.imageRuns.map((id: string, i: number) => ({
          imageRunId: id,
          fileName: entries[i].file.name,
          targetFormat: entries[i].targetFormat,
        }))
      );
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFiles}
        />
        <p className="text-zinc-400 text-sm">
          {entries.length > 0
            ? `${entries.length} file(s) selected`
            : "Click to select up to 5 images"}
        </p>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3"
            >
              <span className="text-sm text-zinc-300 truncate max-w-[60%]">
                {entry.file.name}
              </span>
              <select
                value={entry.targetFormat}
                onChange={(e) => handleFormatChange(i, e.target.value)}
                className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled || loading || entries.length === 0}
        className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Uploading..." : "Convert"}
      </button>
    </div>
  );
}