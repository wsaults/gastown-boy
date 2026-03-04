import { useState, useEffect, useRef, useCallback } from "react";

/** An enriched event from the backend SSE stream. */
export interface StreamEvent {
  ts: string;
  source: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  visibility: string;
  symbol: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface UseEventStreamResult {
  events: StreamEvent[];
  status: ConnectionStatus;
  error: string | null;
  clear: () => void;
}

const MAX_EVENTS = 200;
const API_BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? '/api';

/**
 * React hook that connects to the SSE event stream.
 * Receives an initial batch then live updates.
 * Auto-reconnects on disconnect.
 */
export function useEventStream(enabled = true): UseEventStreamResult {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setStatus("disconnected");
      }
      return;
    }

    setStatus("connecting");
    setError(null);

    const es = new EventSource(`${API_BASE_URL}/events/stream`);
    eventSourceRef.current = es;

    es.addEventListener("init", (e: MessageEvent) => {
      try {
        const initial = JSON.parse(e.data) as StreamEvent[];
        setEvents(initial.slice(-MAX_EVENTS));
        setStatus("connected");
      } catch {
        setError("Failed to parse initial events");
      }
    });

    es.addEventListener("event", (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as StreamEvent;
        setEvents((prev) => [...prev, event].slice(-MAX_EVENTS));
      } catch {
        // Skip malformed event
      }
    });

    es.onerror = () => {
      setStatus("disconnected");
      setError("Connection lost, reconnecting...");
      // EventSource auto-reconnects
    };

    es.onopen = () => {
      setStatus("connected");
      setError(null);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setStatus("disconnected");
    };
  }, [enabled]);

  return { events, status, error, clear };
}
