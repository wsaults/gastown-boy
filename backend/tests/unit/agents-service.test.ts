import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the power-service before importing the module under test
vi.mock("../../src/services/power-service.js", () => ({
  getStatus: vi.fn(),
}));

import { getStatus } from "../../src/services/power-service.js";
import { getAgents } from "../../src/services/agents-service.js";
import type { GastownStatus, AgentStatus, RigStatus } from "../../src/types/index.js";

/**
 * Creates a mock AgentStatus for testing.
 */
function createMockAgent(overrides: Partial<AgentStatus> = {}): AgentStatus {
  return {
    name: "test-agent",
    running: true,
    unreadMail: 0,
    ...overrides,
  };
}

/**
 * Creates a mock RigStatus for testing.
 */
function createMockRig(overrides: Partial<RigStatus> = {}): RigStatus {
  return {
    name: "test-rig",
    path: "/path/to/rig",
    witness: createMockAgent({ name: "witness" }),
    refinery: createMockAgent({ name: "refinery" }),
    crew: [],
    polecats: [],
    mergeQueue: { pending: 0, inFlight: 0, blocked: 0 },
    ...overrides,
  };
}

/**
 * Creates a mock GastownStatus for testing.
 */
function createMockStatus(overrides: Partial<GastownStatus> = {}): GastownStatus {
  return {
    powerState: "running",
    town: {
      name: "gastown",
      root: "/path/to/gastown",
    },
    operator: {
      name: "operator",
      email: "operator@gastown.local",
      unreadMail: 0,
    },
    infrastructure: {
      mayor: createMockAgent({ name: "mayor" }),
      deacon: createMockAgent({ name: "deacon" }),
      daemon: createMockAgent({ name: "daemon" }),
    },
    rigs: [],
    fetchedAt: "2026-01-11T12:00:00Z",
    ...overrides,
  };
}

describe("agents-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getAgents", () => {
    it("should return infrastructure agents when no rigs present", async () => {
      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: createMockStatus(),
      });

      const result = await getAgents();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // mayor + deacon (daemon not included)
      expect(result.data?.[0]).toMatchObject({
        id: "mayor",
        name: "mayor",
        type: "mayor",
        rig: null,
      });
      expect(result.data?.[1]).toMatchObject({
        id: "deacon",
        name: "deacon",
        type: "deacon",
        rig: null,
      });
    });

    it("should include rig agents with rig name in id", async () => {
      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: createMockStatus({
          rigs: [createMockRig({ name: "my-project" })],
        }),
      });

      const result = await getAgents();

      expect(result.success).toBe(true);
      // 2 infrastructure + 2 rig agents (witness + refinery)
      expect(result.data).toHaveLength(4);

      const witness = result.data?.find((a) => a.type === "witness");
      expect(witness).toMatchObject({
        id: "my-project/witness",
        name: "witness",
        type: "witness",
        rig: "my-project",
      });

      const refinery = result.data?.find((a) => a.type === "refinery");
      expect(refinery).toMatchObject({
        id: "my-project/refinery",
        name: "refinery",
        type: "refinery",
        rig: "my-project",
      });
    });

    it("should include crew members from rig", async () => {
      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: createMockStatus({
          rigs: [
            createMockRig({
              name: "project-x",
              crew: [
                createMockAgent({ name: "worker-1" }),
                createMockAgent({ name: "worker-2" }),
              ],
            }),
          ],
        }),
      });

      const result = await getAgents();

      expect(result.success).toBe(true);
      const crewMembers = result.data?.filter((a) => a.type === "crew");
      expect(crewMembers).toHaveLength(2);
      expect(crewMembers?.[0]).toMatchObject({
        id: "project-x/worker-1",
        name: "worker-1",
        type: "crew",
        rig: "project-x",
      });
    });

    it("should include polecats from rig", async () => {
      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: createMockStatus({
          rigs: [
            createMockRig({
              name: "project-y",
              polecats: [
                createMockAgent({ name: "nux" }),
                createMockAgent({ name: "rictus" }),
              ],
            }),
          ],
        }),
      });

      const result = await getAgents();

      expect(result.success).toBe(true);
      const polecats = result.data?.filter((a) => a.type === "polecat");
      expect(polecats).toHaveLength(2);
      expect(polecats?.[0]).toMatchObject({
        id: "project-y/nux",
        name: "nux",
        type: "polecat",
        rig: "project-y",
      });
    });

    describe("status mapping", () => {
      it("should map running agent with no state to idle", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: true }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].status).toBe("idle");
      });

      it("should map working state correctly", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: true, state: "working" }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].status).toBe("working");
      });

      it("should map stuck state correctly", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: true, state: "stuck" }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].status).toBe("stuck");
      });

      it("should map awaiting-gate to blocked", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: true, state: "awaiting-gate" }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].status).toBe("blocked");
      });

      it("should map non-running agent to offline", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: false }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].status).toBe("offline");
      });

      it("should map all agents to offline when system not running", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            powerState: "stopped",
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: true, state: "working" }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].status).toBe("offline");
        expect(result.data?.[1].status).toBe("offline");
      });
    });

    describe("currentTask handling", () => {
      it("should include currentTask when pinnedWork has items", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({
                name: "mayor",
                running: true,
                pinnedWork: ["task-123", "task-456"],
              }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].currentTask).toBe("task-123");
      });

      it("should not include currentTask when pinnedWork is empty", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({
                name: "mayor",
                running: true,
                pinnedWork: [],
              }),
              deacon: createMockAgent({ name: "deacon", running: true }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0]).not.toHaveProperty("currentTask");
      });

      it("should not include currentTask when pinnedWork is undefined", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus(),
        });

        const result = await getAgents();

        expect(result.data?.[0]).not.toHaveProperty("currentTask");
      });
    });

    describe("unreadMail handling", () => {
      it("should include unreadMail count from agent", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            infrastructure: {
              mayor: createMockAgent({ name: "mayor", running: true, unreadMail: 5 }),
              deacon: createMockAgent({ name: "deacon", running: true, unreadMail: 0 }),
              daemon: createMockAgent({ name: "daemon", running: true }),
            },
          }),
        });

        const result = await getAgents();

        expect(result.data?.[0].unreadMail).toBe(5);
        expect(result.data?.[1].unreadMail).toBe(0);
      });
    });

    describe("error handling", () => {
      it("should propagate status service errors", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: false,
          error: {
            code: "CONNECTION_ERROR",
            message: "Failed to connect to gastown",
          },
        });

        const result = await getAgents();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("CONNECTION_ERROR");
        expect(result.error?.message).toBe("Failed to connect to gastown");
      });

      it("should handle missing status data", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: undefined,
        });

        const result = await getAgents();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("STATUS_ERROR");
      });

      it("should provide default error message when none given", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: false,
        });

        const result = await getAgents();

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("STATUS_ERROR");
        expect(result.error?.message).toBe("Failed to get gastown status");
      });
    });

    describe("multiple rigs", () => {
      it("should aggregate agents from multiple rigs", async () => {
        vi.mocked(getStatus).mockResolvedValue({
          success: true,
          data: createMockStatus({
            rigs: [
              createMockRig({
                name: "rig-a",
                crew: [createMockAgent({ name: "alice" })],
              }),
              createMockRig({
                name: "rig-b",
                crew: [createMockAgent({ name: "bob" })],
                polecats: [createMockAgent({ name: "polecat-1" })],
              }),
            ],
          }),
        });

        const result = await getAgents();

        expect(result.success).toBe(true);
        // 2 infrastructure + 2 per rig (witness, refinery) + 1 crew in rig-a + 1 crew + 1 polecat in rig-b
        // = 2 + 2 + 1 + 2 + 1 + 1 = 9
        expect(result.data).toHaveLength(9);

        // Verify crew from both rigs
        const alice = result.data?.find((a) => a.name === "alice");
        expect(alice?.rig).toBe("rig-a");

        const bob = result.data?.find((a) => a.name === "bob");
        expect(bob?.rig).toBe("rig-b");
      });
    });
  });
});
