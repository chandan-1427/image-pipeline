import * as grpc from "@grpc/grpc-js";
import {
  ConvertImageRequest,
  ProgressEvent,
  ImageRunStatus,
} from "@image-pipeline/proto";
import { downloadImage, uploadImage } from "./storage.js";
import { convertImage, getMimeType } from "./converter.js";

export async function convertImageHandler(
  call: grpc.ServerWritableStream<ConvertImageRequest, ProgressEvent>
): Promise<void> {
  const { imageRunId, sourcePath, sourceFormat, targetFormat } = call.request;

  const send = (status: ImageRunStatus, progressPercent: number, extra?: Partial<ProgressEvent>) => {
    call.write({ imageRunId, status, progressPercent, ...extra });
  };

  try {
    // DOWNLOADING
    send(ImageRunStatus.DOWNLOADING, 0);
    const buffer = await downloadImage(sourcePath, process.env.SOURCE_BUCKET!);
    send(ImageRunStatus.DOWNLOADING, 100);

    // CONVERTING
    send(ImageRunStatus.CONVERTING, 0);
    const outputBuffer = await convertImage(buffer, targetFormat, (percent) => {
      send(ImageRunStatus.CONVERTING, percent);
    });
    send(ImageRunStatus.CONVERTING, 100);

    // UPLOADING
    send(ImageRunStatus.UPLOADING, 0);
    const ext = targetFormat.toLowerCase();
    const resultPath = `${imageRunId}.${ext}`;
    const resultUrl = await uploadImage(
      outputBuffer,
      resultPath,
      process.env.CONVERTED_BUCKET!,
      getMimeType(ext)
    );
    send(ImageRunStatus.UPLOADING, 100);

    // DONE
    send(ImageRunStatus.DONE, 100, { resultPath: resultUrl });

    await new Promise((resolve) => setTimeout(resolve, 100));

    call.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    send(ImageRunStatus.FAILED, 0, { error: message });
    call.end();
  }
}