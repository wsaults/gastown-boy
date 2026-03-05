import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Symbol map matching the real implementation
const EVENT_SYMBOLS: Record<string, string> = {
  sling: "→", hook: "+", unhook: "⊘", handoff: "→", done: "✓",
  mail: "✉", spawn: "+", kill: "✗", nudge: "⊘", boot: "+",
  halt: "✗", patrol_started: "→", patrol_complete: "✓", merged: "✓",
  session_start: "+", session_end: "✗", session_death: "✗",
};

// Mock the events-service before importing the router
const mockService = {
  getRecentEvents: vi.fn(),
  startWatching: vi.fn(),
  stopWatching: vi.fn(),
};

vi.mock("../../src/services/events-service.js", () => ({
  EventsService: Object.assign(vi.fn(() => mockService), {
    symbolFor: (type: string) => EVENT_SYMBOLS[type] ?? "?",
  }),
  getEventsService: vi.fn(() => mockService),
}));

import { eventsRouter } from "../../src/routes/events.js";
import { getEventsService } from "../../src/services/events-service.js";
import type { GtEvent } from "../../src/services/events-service.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/events", eventsRouter);
  return app;
}

const SAMPLE_EVENTS: GtEvent[] = [
  {
    ts: "2026-03-04T20:00:00Z",
    source: "gt",
    type: "sling",
    actor: "gastownBoy/witness",
    payload: { bead: "gb-123" },
    visibility: "feed",
  },
  {
    ts: "2026-03-04T20:00:01Z",
    source: "gt",
    type: "done",
    actor: "gastownBoy/polecats/rust",
    payload: { bead: "gb-456" },
    visibility: "feed",
  },
];

describe("Events Routes", () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/events", () => {
    it("should return recent events with default limit", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockReturnValue(SAMPLE_EVENTS);

      const res = await request(app).get("/api/events");

      console.log("RES BODY:", JSON.stringify(res.body));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].type).toBe("sling");
    });

    it("should accept limit query parameter", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockReturnValue([SAMPLE_EVENTS[0]!]);

      const res = await request(app).get("/api/events?limit=1");

      expect(res.status).toBe(200);
      expect(service.getRecentEvents).toHaveBeenCalledWith(
        1,
        expect.objectContaining({})
      );
    });

    it("should accept types filter", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockReturnValue([]);

      const res = await request(app).get("/api/events?types=sling,done");

      expect(res.status).toBe(200);
      expect(service.getRecentEvents).toHaveBeenCalledWith(
        50,
        expect.objectContaining({ types: ["sling", "done"] })
      );
    });

    it("should accept since parameter", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockReturnValue([]);

      const res = await request(app).get(
        "/api/events?since=2026-03-04T20:00:00Z"
      );

      expect(res.status).toBe(200);
      expect(service.getRecentEvents).toHaveBeenCalledWith(
        50,
        expect.objectContaining({ since: "2026-03-04T20:00:00Z" })
      );
    });

    it("should enable dedup by default", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockReturnValue([]);

      await request(app).get("/api/events");

      expect(service.getRecentEvents).toHaveBeenCalledWith(
        50,
        expect.objectContaining({ dedupe: true })
      );
    });

    it("should handle service errors gracefully", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockImplementation(() => {
        throw new Error("File not found");
      });

      const res = await request(app).get("/api/events");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/events/stream", () => {
    it("should set correct SSE headers and send init event", async () => {
      const service = getEventsService();
      vi.mocked(service.getRecentEvents).mockReturnValue([]);

      // SSE streams never end, so we use raw http to read headers + first chunk, then abort
      const http = await import("http");
      const server = app.listen(0);
      const port = (server.address() as { port: number }).port;

      const { headers, body } = await new Promise<{ headers: Record<string, string | string[] | undefined>; body: string }>((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/api/events/stream`, (res) => {
          let data = "";
          res.on("data", (chunk: Buffer) => {
            data += chunk.toString();
            if (data.includes("event: init")) {
              res.destroy();
              resolve({ headers: res.headers, body: data });
            }
          });
          res.on("error", () => resolve({ headers: res.headers, body: data }));
        });
        req.on("error", reject);
        setTimeout(() => { req.destroy(); reject(new Error("timeout")); }, 5000);
      });

      server.close();

      expect(headers["content-type"]).toContain("text/event-stream");
      expect(headers["cache-control"]).toBe("no-cache");
      expect(body).toContain("event: init");
      expect(body).toContain("data: []");
    });
  });
});
