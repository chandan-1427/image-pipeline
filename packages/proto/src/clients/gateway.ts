import * as grpc from "@grpc/grpc-js";
import { WorkerGatewayServiceClient } from "../generated/gateway.js";

export function createGatewayClient(address: string): WorkerGatewayServiceClient {
  return new WorkerGatewayServiceClient(address, grpc.credentials.createInsecure());
}