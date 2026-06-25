import { createEngineClient } from "@image-pipeline/proto";

const address = process.env.ENGINE_ADDRESS ?? "localhost:5000";

export const engineClient = createEngineClient(address);