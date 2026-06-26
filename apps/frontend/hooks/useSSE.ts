import { useEffect, useRef } from "react";
import { SSEEvent } from "../types/index";

export function useSSE(
  batchId: string | null,
  onEvent: (event: SSEEvent) => void,
  onDone: () => void
) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!batchId) return;

    const es = new EventSource(
      `http://localhost:4000/api/batch/${batchId}/stream`
    );
    esRef.current = es;

    es.onmessage = (e) => {
      const event: SSEEvent = JSON.parse(e.data);
      if (event.type === "DONE" || event.status === "BATCH_DONE") {
        onDone();
        es.close();
        return;
      }
      onEvent(event);
    };

    es.onerror = () => {
      console.error("SSE connection error");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [batchId]);
}