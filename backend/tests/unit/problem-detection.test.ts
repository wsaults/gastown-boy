import { describe, it, expect } from "vitest";
import {
  detectAgentProblems,
  buildLastActivityMap,
  type AgentProblem,
} from "../../src/services/problem-detection.js";
import type { AgentRuntimeInfo } from "../../src/services/agent-data.js";
import type { GtEvent } from "../../src/services/events-service.js";

// =============================================================================
// Test Fixtures
// =============================================================================

function createAgent(overrides: Partial<AgentRuntimeInfo> = {}): AgentRuntimeInfo {
  return {
    id: "test",
    name: "chrome",
    address: "gastownBoy/chrome",
    role: "polecat",
    rig: "gastownBoy",
    running: true,
    unreadMail: 0,
    sessionName: "gb-chrome",
    ...overrides,
  };
}

function createEvent(overrides: Partial<GtEvent> = {}): GtEvent {
  return {
    ts: new Date().toISOString(),
    source: "test",
    type: "hook",
    actor: "gastownBoy/chrome",
    payload: {},
    visibility: "public",
    ...overrides,
  };
}

function minutesAgo(minutes: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - minutes * 60 * 1000);
}

// =============================================================================
// Tests: detectAgentProblems
// =============================================================================

describe("problem-detection", () => {
  describe("detectAgentProblems", () => {
    const now = new Date("2026-03-05T12:00:00Z");

    it("should return empty array for healthy working agent", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });
      const lastActivity = minutesAgo(5, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toEqual([]);
    });

    it("should detect zombie: dead session with hooked work", () => {
      const agent = createAgent({ running: false, hookBead: "gb-003" });

      const problems = detectAgentProblems(agent, null, now);

      expect(problems).toHaveLength(1);
      expect(problems[0].type).toBe("zombie");
    });

    it("should not flag zombie for offline agent without hooked work", () => {
      const agent = createAgent({ running: false });

      const problems = detectAgentProblems(agent, null, now);

      expect(problems).toEqual([]);
    });

    it("should detect GUPP violation: hooked work + 30m no activity", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });
      const lastActivity = minutesAgo(35, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toHaveLength(1);
      expect(problems[0].type).toBe("gupp_violation");
      expect(problems[0].minutesIdle).toBe(35);
    });

    it("should detect stalled: hooked work + 15m no activity", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });
      const lastActivity = minutesAgo(20, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toHaveLength(1);
      expect(problems[0].type).toBe("stalled");
      expect(problems[0].minutesIdle).toBe(20);
    });

    it("should not flag stalled for agent active within 15m", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });
      const lastActivity = minutesAgo(10, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toEqual([]);
    });

    it("should not flag timing problems for agents without hooked work", () => {
      const agent = createAgent({ running: true, state: "idle" });
      const lastActivity = minutesAgo(60, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toEqual([]);
    });

    it("should not flag timing problems when no activity data exists", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });

      const problems = detectAgentProblems(agent, null, now);

      expect(problems).toEqual([]);
    });

    it("should prefer GUPP over stalled at exactly 30m boundary", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });
      const lastActivity = minutesAgo(30, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toHaveLength(1);
      expect(problems[0].type).toBe("gupp_violation");
    });

    it("should return stalled at exactly 15m boundary", () => {
      const agent = createAgent({ running: true, hookBead: "gb-003", state: "working" });
      const lastActivity = minutesAgo(15, now);

      const problems = detectAgentProblems(agent, lastActivity, now);

      expect(problems).toHaveLength(1);
      expect(problems[0].type).toBe("stalled");
    });
  });

  // ===========================================================================
  // Tests: buildLastActivityMap
  // ===========================================================================

  describe("buildLastActivityMap", () => {
    it("should build a map of actor to last activity timestamp", () => {
      const events: GtEvent[] = [
        createEvent({ actor: "gastownBoy/chrome", ts: "2026-03-05T10:00:00Z" }),
        createEvent({ actor: "gastownBoy/chrome", ts: "2026-03-05T11:00:00Z" }),
        createEvent({ actor: "gastownBoy/nickel", ts: "2026-03-05T09:00:00Z" }),
      ];

      const map = buildLastActivityMap(events);

      expect(map.get("gastownBoy/chrome")?.toISOString()).toBe("2026-03-05T11:00:00.000Z");
      expect(map.get("gastownBoy/nickel")?.toISOString()).toBe("2026-03-05T09:00:00.000Z");
    });

    it("should return empty map for empty events", () => {
      const map = buildLastActivityMap([]);
      expect(map.size).toBe(0);
    });

    it("should keep the latest timestamp per actor", () => {
      const events: GtEvent[] = [
        createEvent({ actor: "a", ts: "2026-03-05T12:00:00Z" }),
        createEvent({ actor: "a", ts: "2026-03-05T08:00:00Z" }),
        createEvent({ actor: "a", ts: "2026-03-05T10:00:00Z" }),
      ];

      const map = buildLastActivityMap(events);

      expect(map.get("a")?.toISOString()).toBe("2026-03-05T12:00:00.000Z");
    });
  });
});
