import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process before importing
vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ""),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("../../src/services/gastown-workspace.js", () => ({
  resolveGtBinary: vi.fn(() => "/usr/local/bin/gt"),
  resolveTownRoot: vi.fn(() => "/tmp/town"),
  extractBeadPrefix: vi.fn(),
  listAllBeadsDirs: vi.fn(() => []),
  resolveBeadsDirFromId: vi.fn(),
}));

vi.mock("../../src/services/tmux.js", () => ({
  listTmuxSessions: vi.fn(() => new Set<string>()),
}));

vi.mock("../../src/services/bd-client.js", () => ({
  execBd: vi.fn(() => ({ success: true, data: [] })),
  stripBeadPrefix: vi.fn((id: string) => id),
}));

vi.mock("../../src/services/mail-data.js", () => ({
  listMailIssues: vi.fn(() => []),
  buildMailIndex: vi.fn(() => new Map()),
}));

vi.mock("../../src/utils/index.js", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

import { execFileSync } from "child_process";
import { fetchAgentsFromGtStatus, collectAgentSnapshot } from "../../src/services/agent-data.js";

// =============================================================================
// Test Fixtures
// =============================================================================

const GT_STATUS_WITH_CREW = JSON.stringify({
  agents: [
    {
      name: "mayor",
      address: "mayor/",
      session: "hq-mayor",
      role: "coordinator",
      running: true,
      has_work: false,
      unread_mail: 0,
    },
    {
      name: "deacon",
      address: "deacon/",
      session: "hq-deacon",
      role: "health-check",
      running: true,
      has_work: false,
      unread_mail: 0,
    },
  ],
  rigs: [
    {
      name: "gastownBoy",
      agents: [
        {
          name: "witness",
          address: "gastownBoy/witness",
          session: "gb-witness",
          role: "witness",
          running: true,
          has_work: false,
          unread_mail: 0,
        },
        {
          name: "refinery",
          address: "gastownBoy/refinery",
          session: "gb-refinery",
          role: "refinery",
          running: true,
          has_work: false,
          unread_mail: 0,
        },
        {
          name: "chrome",
          address: "gastownBoy/chrome",
          session: "gb-chrome",
          role: "polecat",
          running: true,
          has_work: true,
          work_title: "Fix crew display",
          hook_bead: "gb-dap",
          state: "working",
          unread_mail: 0,
        },
        {
          name: "carl",
          address: "gastownBoy/crew/carl",
          session: "gb-crew-carl",
          role: "crew",
          running: false,
          has_work: false,
          unread_mail: 0,
        },
      ],
    },
  ],
});

// =============================================================================
// Tests
// =============================================================================

describe("agent-data gt status integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAgentsFromGtStatus", () => {
    it("should parse all agent types from gt status --json including crew", async () => {
      vi.mocked(execFileSync).mockReturnValue(GT_STATUS_WITH_CREW);

      const agents = await fetchAgentsFromGtStatus("/tmp/town");

      expect(agents).toHaveLength(6);

      // Town-level agents
      const mayor = agents.find((a) => a.name === "mayor");
      expect(mayor).toBeDefined();
      expect(mayor?.role).toBe("mayor");
      expect(mayor?.rig).toBeNull();
      expect(mayor?.running).toBe(true);

      const deacon = agents.find((a) => a.name === "deacon");
      expect(deacon).toBeDefined();
      expect(deacon?.role).toBe("deacon");

      // Rig-level infrastructure
      const witness = agents.find((a) => a.name === "witness");
      expect(witness).toBeDefined();
      expect(witness?.role).toBe("witness");
      expect(witness?.rig).toBe("gastownBoy");
      expect(witness?.sessionName).toBe("gb-witness");

      // Crew member — the main bug fix
      const carl = agents.find((a) => a.name === "carl");
      expect(carl).toBeDefined();
      expect(carl?.role).toBe("crew");
      expect(carl?.rig).toBe("gastownBoy");
      expect(carl?.address).toBe("gastownBoy/crew/carl");
      expect(carl?.sessionName).toBe("gb-crew-carl");
      expect(carl?.running).toBe(false);

      // Polecat with work
      const chrome = agents.find((a) => a.name === "chrome");
      expect(chrome).toBeDefined();
      expect(chrome?.role).toBe("polecat");
      expect(chrome?.state).toBe("working");
      expect(chrome?.hookBead).toBe("gb-dap");
      expect(chrome?.hookBeadTitle).toBe("Fix crew display");
    });

    it("should return empty array on gt status failure", async () => {
      vi.mocked(execFileSync).mockImplementation(() => {
        throw new Error("gt not found");
      });

      const agents = await fetchAgentsFromGtStatus("/tmp/town");
      expect(agents).toEqual([]);
    });

    it("should handle malformed JSON gracefully", async () => {
      vi.mocked(execFileSync).mockReturnValue("not json");

      const agents = await fetchAgentsFromGtStatus("/tmp/town");
      expect(agents).toEqual([]);
    });

    it("should handle empty status output", async () => {
      vi.mocked(execFileSync).mockReturnValue(JSON.stringify({}));

      const agents = await fetchAgentsFromGtStatus("/tmp/town");
      expect(agents).toEqual([]);
    });
  });

  describe("collectAgentSnapshot with gt status", () => {
    it("should include crew members in the agent snapshot", async () => {
      vi.mocked(execFileSync).mockReturnValue(GT_STATUS_WITH_CREW);

      const { agents } = await collectAgentSnapshot("/tmp/town");

      // Should include all 6 agents
      expect(agents.length).toBeGreaterThanOrEqual(6);

      // Crew member should be present
      const carl = agents.find((a) => a.name === "carl");
      expect(carl).toBeDefined();
      expect(carl?.role).toBe("crew");
      expect(carl?.address).toBe("gastownBoy/crew/carl");
    });

    it("should fall back to beads+tmux when gt status fails", async () => {
      vi.mocked(execFileSync).mockImplementation(() => {
        throw new Error("gt not running");
      });

      // Even with gt status failing, snapshot should succeed (empty but no throw)
      const { agents } = await collectAgentSnapshot("/tmp/town");
      expect(agents).toBeDefined();
      // Will be empty since beads and tmux are also mocked to return empty
      expect(agents).toEqual([]);
    });
  });
});
