import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { EventsService, type GtEvent } from "../../src/services/events-service.js";

// Mock fs module
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  statSync: vi.fn(() => ({ size: 1000 })),
}));

// Mock fs/promises for watch
vi.mock("fs/promises", () => ({
  open: vi.fn(),
}));

const SAMPLE_EVENTS: GtEvent[] = [
  {
    ts: "2026-03-04T20:00:00Z",
    source: "gt",
    type: "sling",
    actor: "gastownBoy/witness",
    payload: { bead: "gb-123", target: "gastownBoy/polecats/rust" },
    visibility: "feed",
  },
  {
    ts: "2026-03-04T20:00:01Z",
    source: "gt",
    type: "session_start",
    actor: "gastownBoy/polecats/rust",
    payload: { session_id: "abc-123", role: "gastownBoy/polecats/rust" },
    visibility: "feed",
  },
  {
    ts: "2026-03-04T20:00:02Z",
    source: "gt",
    type: "nudge",
    actor: "gastownBoy/rust",
    payload: { reason: "session-started", target: "deacon" },
    visibility: "feed",
  },
  {
    ts: "2026-03-04T20:00:03Z",
    source: "gt",
    type: "done",
    actor: "gastownBoy/polecats/rust",
    payload: { bead: "gb-456" },
    visibility: "feed",
  },
  {
    ts: "2026-03-04T20:00:04Z",
    source: "gt",
    type: "mail",
    actor: "mayor",
    payload: { subject: "Work assigned", to: "gastownBoy/witness" },
    visibility: "feed",
  },
];

function sampleEventLines(): string {
  return SAMPLE_EVENTS.map((e) => JSON.stringify(e)).join("\n") + "\n";
}

describe("EventsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getRecentEvents", () => {
    it("should parse JSONL events from the events file", () => {
      vi.mocked(readFileSync).mockReturnValue(sampleEventLines());
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50);

      expect(events).toHaveLength(5);
      expect(events[0]!.type).toBe("sling");
      expect(events[4]!.type).toBe("mail");
    });

    it("should limit returned events to requested count", () => {
      vi.mocked(readFileSync).mockReturnValue(sampleEventLines());
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(2);

      expect(events).toHaveLength(2);
      // Should return the LAST 2 events (most recent)
      expect(events[0]!.type).toBe("done");
      expect(events[1]!.type).toBe("mail");
    });

    it("should skip malformed JSON lines", () => {
      const lines = `{"ts":"2026-03-04T20:00:00Z","source":"gt","type":"sling","actor":"test","payload":{},"visibility":"feed"}
not valid json
{"ts":"2026-03-04T20:00:01Z","source":"gt","type":"done","actor":"test","payload":{},"visibility":"feed"}
`;
      vi.mocked(readFileSync).mockReturnValue(lines);
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50);
      expect(events).toHaveLength(2);
    });

    it("should skip empty lines", () => {
      const lines = `{"ts":"2026-03-04T20:00:00Z","source":"gt","type":"sling","actor":"test","payload":{},"visibility":"feed"}

{"ts":"2026-03-04T20:00:01Z","source":"gt","type":"done","actor":"test","payload":{},"visibility":"feed"}
`;
      vi.mocked(readFileSync).mockReturnValue(lines);
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50);
      expect(events).toHaveLength(2);
    });
  });

  describe("formatEventSymbol", () => {
    it("should return correct gt feed symbols for event types", () => {
      expect(EventsService.symbolFor("sling")).toBe("→");
      expect(EventsService.symbolFor("hook")).toBe("+");
      expect(EventsService.symbolFor("unhook")).toBe("⊘");
      expect(EventsService.symbolFor("done")).toBe("✓");
      expect(EventsService.symbolFor("handoff")).toBe("→");
      expect(EventsService.symbolFor("mail")).toBe("✉");
      expect(EventsService.symbolFor("spawn")).toBe("+");
      expect(EventsService.symbolFor("kill")).toBe("✗");
      expect(EventsService.symbolFor("nudge")).toBe("⊘");
      expect(EventsService.symbolFor("boot")).toBe("+");
      expect(EventsService.symbolFor("halt")).toBe("✗");
      expect(EventsService.symbolFor("merged")).toBe("✓");
      expect(EventsService.symbolFor("session_start")).toBe("+");
      expect(EventsService.symbolFor("session_end")).toBe("✗");
      expect(EventsService.symbolFor("session_death")).toBe("✗");
      expect(EventsService.symbolFor("patrol_started")).toBe("→");
      expect(EventsService.symbolFor("patrol_complete")).toBe("✓");
    });

    it("should return ? for unknown event types", () => {
      expect(EventsService.symbolFor("unknown_type")).toBe("?");
    });
  });

  describe("deduplication", () => {
    it("should deduplicate events within 2s window with same type+actor", () => {
      const lines = [
        { ts: "2026-03-04T20:00:00Z", source: "gt", type: "nudge", actor: "deacon", payload: {}, visibility: "feed" },
        { ts: "2026-03-04T20:00:01Z", source: "gt", type: "nudge", actor: "deacon", payload: {}, visibility: "feed" },
        { ts: "2026-03-04T20:00:01.5Z", source: "gt", type: "nudge", actor: "deacon", payload: {}, visibility: "feed" },
      ]
        .map((e) => JSON.stringify(e))
        .join("\n") + "\n";

      vi.mocked(readFileSync).mockReturnValue(lines);
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50, { dedupe: true });
      expect(events).toHaveLength(1);
    });

    it("should NOT deduplicate events from different actors", () => {
      const lines = [
        { ts: "2026-03-04T20:00:00Z", source: "gt", type: "nudge", actor: "deacon", payload: {}, visibility: "feed" },
        { ts: "2026-03-04T20:00:01Z", source: "gt", type: "nudge", actor: "witness", payload: {}, visibility: "feed" },
      ]
        .map((e) => JSON.stringify(e))
        .join("\n") + "\n";

      vi.mocked(readFileSync).mockReturnValue(lines);
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50, { dedupe: true });
      expect(events).toHaveLength(2);
    });

    it("should NOT deduplicate events beyond 2s window", () => {
      const lines = [
        { ts: "2026-03-04T20:00:00Z", source: "gt", type: "nudge", actor: "deacon", payload: {}, visibility: "feed" },
        { ts: "2026-03-04T20:00:03Z", source: "gt", type: "nudge", actor: "deacon", payload: {}, visibility: "feed" },
      ]
        .map((e) => JSON.stringify(e))
        .join("\n") + "\n";

      vi.mocked(readFileSync).mockReturnValue(lines);
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50, { dedupe: true });
      expect(events).toHaveLength(2);
    });
  });

  describe("filtering", () => {
    it("should filter by event types when specified", () => {
      vi.mocked(readFileSync).mockReturnValue(sampleEventLines());
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50, { types: ["sling", "done"] });
      expect(events).toHaveLength(2);
      expect(events[0]!.type).toBe("sling");
      expect(events[1]!.type).toBe("done");
    });

    it("should filter events after a given timestamp", () => {
      vi.mocked(readFileSync).mockReturnValue(sampleEventLines());
      const service = new EventsService("/tmp/test-events.jsonl");

      const events = service.getRecentEvents(50, { since: "2026-03-04T20:00:02Z" });
      // Should include events at 20:00:02, 20:00:03, 20:00:04
      expect(events).toHaveLength(3);
      expect(events[0]!.type).toBe("nudge");
    });
  });
});
