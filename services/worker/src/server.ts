import "dotenv/config";
import * as grpc from "@grpc/grpc-js";
import { WorkerServiceService } from "@image-pipeline/proto";
import { convertImageHandler } from "./handler.js";

const PORT = process.env.WORKER_PORT ?? "7000";

const server = new grpc.Server();

server.addService(WorkerServiceService, {
  convertImage: convertImageHandler,
});

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Worker server failed to start:", err);
      process.exit(1);
    }
    console.log(`Worker service running on port ${port}`);
  }
);