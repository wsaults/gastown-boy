import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventStream, type StreamEvent } from "../../../src/hooks/useEventStream";

/** Mock EventSource that lets us control events in tests */
class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  readyState = 0; // CONNECTING
  onopen: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  private listeners: Record<string, ((e: MessageEvent) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (e: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type]!.push(listener);
  }

  removeEventListener(type: string, listener: (e: MessageEvent) => void) {
    const list = this.listeners[type];
    if (list) {
      this.listeners[type] = list.filter((l) => l !== listener);
    }
  }

  close = vi.fn();

  // Test helpers
  simulateOpen() {
    this.readyState = 1; // OPEN
    this.onopen?.(new Event("open"));
  }

  simulateEvent(type: string, data: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) });
    this.listeners[type]?.forEach((l) => l(event));
  }

  simulateError() {
    this.readyState = 2; // CLOSED
    this.onerror?.(new Event("error"));
  }
}

const SAMPLE_EVENTS: StreamEvent[] = [
  {
    ts: "2026-03-04T20:00:00Z",
    source: "gt",
    type: "sling",
    actor: "gastownBoy/witness",
    payload: { bead: "gb-123" },
    visibility: "feed",
    symbol: "→",
  },
  {
    ts: "2026-03-04T20:00:01Z",
    source: "gt",
    type: "done",
    actor: "gastownBoy/polecats/rust",
    payload: { bead: "gb-456" },
    visibility: "feed",
    symbol: "✓",
  },
];

describe("useEventStream", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    // Replace global EventSource with our mock
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should start in connecting status when enabled", () => {
    const { result } = renderHook(() => useEventStream(true));

    expect(result.current.status).toBe("connecting");
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not connect when disabled", () => {
    renderHook(() => useEventStream(false));

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it("should populate events from init event", () => {
    const { result } = renderHook(() => useEventStream(true));

    const es = MockEventSource.instances[0]!;

    act(() => {
      es.simulateOpen();
      es.simulateEvent("init", SAMPLE_EVENTS);
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0]!.type).toBe("sling");
    expect(result.current.events[1]!.type).toBe("done");
  });

  it("should append new events from stream", () => {
    const { result } = renderHook(() => useEventStream(true));
    const es = MockEventSource.instances[0]!;

    act(() => {
      es.simulateOpen();
      es.simulateEvent("init", SAMPLE_EVENTS);
    });

    const newEvent: StreamEvent = {
      ts: "2026-03-04T20:00:05Z",
      source: "gt",
      type: "mail",
      actor: "mayor",
      payload: { subject: "New task" },
      visibility: "feed",
      symbol: "✉",
    };

    act(() => {
      es.simulateEvent("event", newEvent);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[2]!.type).toBe("mail");
  });

  it("should set error on connection failure", () => {
    const { result } = renderHook(() => useEventStream(true));
    const es = MockEventSource.instances[0]!;

    act(() => {
      es.simulateError();
    });

    expect(result.current.status).toBe("disconnected");
    expect(result.current.error).toBeTruthy();
  });

  it("should close connection on unmount", () => {
    const { unmount } = renderHook(() => useEventStream(true));
    const es = MockEventSource.instances[0]!;

    unmount();

    expect(es.close).toHaveBeenCalled();
  });

  it("should close connection when disabled", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useEventStream(enabled),
      { initialProps: { enabled: true } }
    );

    const es = MockEventSource.instances[0]!;

    rerender({ enabled: false });

    expect(es.close).toHaveBeenCalled();
  });

  it("should clear events when clear is called", () => {
    const { result } = renderHook(() => useEventStream(true));
    const es = MockEventSource.instances[0]!;

    act(() => {
      es.simulateOpen();
      es.simulateEvent("init", SAMPLE_EVENTS);
    });

    expect(result.current.events).toHaveLength(2);

    act(() => {
      result.current.clear();
    });

    expect(result.current.events).toHaveLength(0);
  });

  it("should cap events at MAX_EVENTS (200)", () => {
    const { result } = renderHook(() => useEventStream(true));
    const es = MockEventSource.instances[0]!;

    // Create 210 events
    const manyEvents: StreamEvent[] = Array.from({ length: 210 }, (_, i) => ({
      ts: `2026-03-04T20:00:${String(i).padStart(2, "0")}Z`,
      source: "gt",
      type: "nudge",
      actor: "test",
      payload: {},
      visibility: "feed",
      symbol: "⊘",
    }));

    act(() => {
      es.simulateOpen();
      es.simulateEvent("init", manyEvents);
    });

    expect(result.current.events).toHaveLength(200);
  });
});
