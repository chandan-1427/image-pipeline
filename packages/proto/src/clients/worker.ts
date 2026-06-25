import * as grpc from "@grpc/grpc-js";
import { WorkerServiceClient } from "../generated/worker.js";

export function createWorkerClient(address: string): WorkerServiceClient {
  return new WorkerServiceClient(address, grpc.credentials.createInsecure());
}