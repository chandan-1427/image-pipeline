import "dotenv/config";
import * as grpc from "@grpc/grpc-js";
import { WorkerGatewayServiceService } from "@image-pipeline/proto";
import { assignBatchHandler } from "./handler.js";

const PORT = process.env.GATEWAY_PORT ?? "6000";

const server = new grpc.Server();

server.addService(WorkerGatewayServiceService, {
  assignBatch: assignBatchHandler,
});

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Worker Gateway server failed to start:", err);
      process.exit(1);
    }
    console.log(`Worker Gateway service running on port ${port}`);
  }
);