import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import batch from "./routes/batch.js";

const app = new Hono();

app.use("*", cors({ origin: "http://localhost:3000" }));

app.route("/api/batch", batch);

app.get("/health", (c) => c.json({ status: "ok" }));

const PORT = Number(process.env.API_PORT ?? 4000);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API service running on port ${PORT}`);
});