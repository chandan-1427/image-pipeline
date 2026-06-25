import { Context } from "hono";
import { streamSSE } from "hono/streaming";

export type SSEStreamEvent = {
  imageRunId: string;
  status: string;
  progressPercent: number;
  error?: string;
  resultPath?: string;
  type?: string;
};

export function createSSEStream(
  c: Context,
  handler: (send: (event: SSEStreamEvent) => Promise<void>) => Promise<void>
) {
  return streamSSE(c, async (stream) => {
    const send = async (event: SSEStreamEvent) => {
      await stream.writeSSE({
        data: JSON.stringify(event),
      });
    };
    await handler(send);
  });
}