import * as grpc from "@grpc/grpc-js";
import {
  ConvertBatchRequest,
  ProgressEvent,
  createGatewayClient,
} from "@image-pipeline/proto";

export function convertBatchHandler(
  call: grpc.ServerWritableStream<ConvertBatchRequest, ProgressEvent>
): void {
  const { batchId, images } = call.request;
  const gatewayClient = createGatewayClient(process.env.GATEWAY_ADDRESS!);

  console.log(`Engine received batch ${batchId} with ${images.length} images`);

  const gatewayStream = gatewayClient.assignBatch({ batchId, images });

  gatewayStream.on("data", (event: ProgressEvent) => {
    call.write(event);
  });

  gatewayStream.on("error", (err: Error) => {
    console.error(`Gateway stream error for batch ${batchId}:`, err.message);
    gatewayClient.close();
    call.destroy(err);
  });

  gatewayStream.on("end", () => {
    console.log(`Batch ${batchId} completed`);
    gatewayClient.close();
    call.end();
  });
}