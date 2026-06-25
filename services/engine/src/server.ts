import "dotenv/config";
import * as grpc from "@grpc/grpc-js";
import { EngineServiceService } from "@image-pipeline/proto";
import { convertBatchHandler } from "./handler.js";

const PORT = process.env.ENGINE_PORT ?? "5000";

const server = new grpc.Server();

server.addService(EngineServiceService, {
  convertBatch: convertBatchHandler,
});

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Engine server failed to start:", err);
      process.exit(1);
    }
    console.log(`Engine service running on port ${port}`);
  }
);