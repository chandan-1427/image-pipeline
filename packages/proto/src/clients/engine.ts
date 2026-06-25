import * as grpc from "@grpc/grpc-js";
import { EngineServiceClient } from "../generated/engine.js";

export function createEngineClient(address: string): EngineServiceClient {
  return new EngineServiceClient(address, grpc.credentials.createInsecure());
}