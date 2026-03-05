/**
 * Events route for the gastown-boy API.
 *
 * Endpoints:
 * - GET /api/events - Get recent events (JSON)
 * - GET /api/events/stream - SSE endpoint for real-time events
 */

import { Router } from "express";
import { getEventsService, EventsService } from "../services/events-service.js";
import { success, internalError } from "../utils/responses.js";
import type { GtEvent } from "../services/events-service.js";

export const eventsRouter = Router();

/**
 * GET /api/events
 * Returns recent events from the events log.
 * Query params:
 *   - limit: number of events to return (default: 50)
 *   - types: comma-separated event types to filter
 *   - since: ISO timestamp to filter events after
 *   - dedupe: whether to deduplicate (default: true)
 */
eventsRouter.get("/", (req, res) => {
  try {
    const service = getEventsService();

    const limit = Math.min(
      Math.max(1, parseInt(req.query["limit"] as string, 10) || 50),
      200
    );

    const types = (req.query["types"] as string)
      ?.split(",")
      .filter(Boolean);

    const since = req.query["since"] as string | undefined;
    const dedupe = req.query["dedupe"] !== "false";

    const events = service.getRecentEvents(limit, {
      types,
      since,
      dedupe,
    });

    // Enrich events with symbols
    const enriched = events.map((e) => ({
      ...e,
      symbol: EventsService.symbolFor(e.type),
    }));

    return res.json(success(enriched));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get events";
    return res.status(500).json(internalError(message));
  }
});

/**
 * GET /api/events/stream
 * Server-Sent Events endpoint for real-time event push.
 * Sends initial batch of recent events, then streams new ones.
 */
eventsRouter.get("/stream", (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  const service = getEventsService();

  // Send initial batch
  try {
    const initial = service.getRecentEvents(50, { dedupe: true });
    const enriched = initial.map((e) => ({
      ...e,
      symbol: EventsService.symbolFor(e.type),
    }));
    res.write(`event: init\ndata: ${JSON.stringify(enriched)}\n\n`);
  } catch {
    // If initial read fails, send empty init
    res.write(`event: init\ndata: []\n\n`);
  }

  // Send heartbeat every 30s to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  // Listen for new events
  const onNewEvents = (events: GtEvent[]) => {
    const enriched = events.map((e) => ({
      ...e,
      symbol: EventsService.symbolFor(e.type),
    }));
    for (const event of enriched) {
      res.write(`event: event\ndata: ${JSON.stringify(event)}\n\n`);
    }
  };

  service.startWatching(onNewEvents);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    service.stopWatching(onNewEvents);
  });
});
