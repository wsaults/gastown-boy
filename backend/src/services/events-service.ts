/**
 * Events service for gastown-boy.
 *
 * Reads ~/gt/.events.jsonl and provides:
 * - Recent event retrieval with filtering
 * - Deduplication (2s window, same type+actor)
 * - Symbol mapping for gt feed vocabulary
 * - File watching for SSE push
 */

import { readFileSync, existsSync, statSync } from "fs";
import { watch, type FSWatcher } from "fs";
import { resolveTownRoot } from "./gastown-workspace.js";

/** A single event from the events.jsonl file. */
export interface GtEvent {
  ts: string;
  source: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  visibility: string;
}

/** Options for filtering and deduplication. */
export interface EventQueryOptions {
  /** Filter to specific event types */
  types?: string[];
  /** Only return events after this ISO timestamp */
  since?: string | undefined;
  /** Enable 2s dedup for same type+actor (default: false) */
  dedupe?: boolean;
}

/** Symbol map following gt feed vocabulary */
const EVENT_SYMBOLS: Record<string, string> = {
  sling: "→",
  hook: "+",
  unhook: "⊘",
  handoff: "→",
  done: "✓",
  mail: "✉",
  spawn: "+",
  kill: "✗",
  nudge: "⊘",
  boot: "+",
  halt: "✗",
  patrol_started: "→",
  patrol_complete: "✓",
  merged: "✓",
  session_start: "+",
  session_end: "✗",
  session_death: "✗",
};

const DEDUPE_WINDOW_MS = 2000;

export class EventsService {
  private readonly eventsPath: string;
  private watcher: FSWatcher | null = null;
  private lastSize = 0;
  private listeners: Set<(events: GtEvent[]) => void> = new Set();

  constructor(eventsPath?: string) {
    this.eventsPath =
      eventsPath ?? `${resolveTownRoot()}/.events.jsonl`;
  }

  /** Get the gt feed symbol for an event type. */
  static symbolFor(type: string): string {
    return EVENT_SYMBOLS[type] ?? "?";
  }

  /**
   * Read recent events from the JSONL file.
   * Returns the last `limit` events, optionally filtered.
   */
  getRecentEvents(limit: number, options: EventQueryOptions = {}): GtEvent[] {
    if (!existsSync(this.eventsPath)) {
      return [];
    }

    const content = readFileSync(this.eventsPath, "utf-8");
    let events = this.parseEvents(content);

    // Filter by types
    if (options.types && options.types.length > 0) {
      const typeSet = new Set(options.types);
      events = events.filter((e) => typeSet.has(e.type));
    }

    // Filter by timestamp
    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      events = events.filter((e) => new Date(e.ts).getTime() >= sinceTime);
    }

    // Deduplicate
    if (options.dedupe) {
      events = this.deduplicateEvents(events);
    }

    // Return last N events
    return events.slice(-limit);
  }

  /** Parse JSONL content into event objects, skipping invalid lines. */
  private parseEvents(content: string): GtEvent[] {
    const events: GtEvent[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const event = JSON.parse(trimmed) as GtEvent;
        events.push(event);
      } catch {
        // Skip malformed lines
      }
    }

    return events;
  }

  /** Deduplicate events within a 2s window for same type+actor. */
  private deduplicateEvents(events: GtEvent[]): GtEvent[] {
    if (events.length === 0) return events;

    const result: GtEvent[] = [events[0]!];

    for (let i = 1; i < events.length; i++) {
      const current = events[i]!;
      const prev = result[result.length - 1]!;

      const sameTypeAndActor =
        current.type === prev.type && current.actor === prev.actor;

      if (sameTypeAndActor) {
        const timeDiff =
          new Date(current.ts).getTime() - new Date(prev.ts).getTime();
        if (timeDiff < DEDUPE_WINDOW_MS) {
          // Skip duplicate
          continue;
        }
      }

      result.push(current);
    }

    return result;
  }

  /**
   * Start watching the events file for new entries.
   * Calls the listener with new events as they're appended.
   */
  startWatching(listener: (events: GtEvent[]) => void): void {
    this.listeners.add(listener);

    if (this.watcher) return; // Already watching

    try {
      const stat = statSync(this.eventsPath);
      this.lastSize = stat.size;
    } catch {
      this.lastSize = 0;
    }

    this.watcher = watch(this.eventsPath, () => {
      this.checkForNewEvents();
    });
  }

  /** Stop watching and remove a listener. */
  stopWatching(listener: (events: GtEvent[]) => void): void {
    this.listeners.delete(listener);

    if (this.listeners.size === 0 && this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /** Check for new events since last read and notify listeners. */
  private checkForNewEvents(): void {
    try {
      const stat = statSync(this.eventsPath);
      if (stat.size <= this.lastSize) return;

      // Read the new portion of the file
      const content = readFileSync(this.eventsPath, "utf-8");
      const newContent = content.substring(this.lastSize);
      this.lastSize = stat.size;

      const newEvents = this.parseEvents(newContent);
      if (newEvents.length > 0) {
        for (const listener of this.listeners) {
          listener(newEvents);
        }
      }
    } catch {
      // File may be temporarily unavailable during writes
    }
  }
}

// Singleton instance
let eventsServiceInstance: EventsService | null = null;

/** Get the singleton EventsService instance. */
export function getEventsService(): EventsService {
  if (!eventsServiceInstance) {
    eventsServiceInstance = new EventsService();
  }
  return eventsServiceInstance;
}
