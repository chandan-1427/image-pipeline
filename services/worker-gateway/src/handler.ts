import * as grpc from "@grpc/grpc-js";
import {
  AssignBatchRequest,
  ProgressEvent,
  createWorkerClient,
} from "@image-pipeline/proto";

export function assignBatchHandler(
  call: grpc.ServerWritableStream<AssignBatchRequest, ProgressEvent>
): void {
  const { images } = call.request;
  const workerClient = createWorkerClient(process.env.WORKER_ADDRESS!);

  let completedStreams = 0;
  const totalStreams = images.length;

  if (totalStreams === 0) {
    call.end();
    return;
  }

  for (const image of images) {
    const workerStream = workerClient.convertImage(image);

    workerStream.on("data", (event: ProgressEvent) => {
      call.write(event);
    });

    workerStream.on("error", (err: Error) => {
      call.write({
        imageRunId: image.imageRunId,
        status: "FAILED",
        progressPercent: 0,
        error: err.message,
      } as ProgressEvent);
      completedStreams++;
      if (completedStreams === totalStreams) {
        workerClient.close();
        call.end();
      }
    });

    workerStream.on("end", () => {
      completedStreams++;
      if (completedStreams === totalStreams) {
        workerClient.close();
        call.end();
      }
    });
  }
}