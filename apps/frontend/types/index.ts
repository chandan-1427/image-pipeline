export type ImageRunStatus =
  | "QUEUED"
  | "DOWNLOADING"
  | "CONVERTING"
  | "UPLOADING"
  | "DONE"
  | "FAILED";

export type ImageRunState = {
  imageRunId: string;
  status: ImageRunStatus;
  progressPercent: number;
  resultPath?: string;
  error?: string;
  fileName: string;
  targetFormat: string;
};

export type BatchState = {
  batchId: string;
  imageRuns: ImageRunState[];
  completed: boolean;
};

export type SSEEvent = {
  imageRunId: string;
  status: ImageRunStatus | "BATCH_DONE" | "ERROR";
  progressPercent: number;
  resultPath?: string;
  error?: string;
  type?: string;
};