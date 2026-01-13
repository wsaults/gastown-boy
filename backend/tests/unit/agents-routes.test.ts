import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock the agents-service before importing the router
vi.mock("../../src/services/agents-service.js", () => ({
  getAgents: vi.fn(),
}));

import { agentsRouter } from "../../src/routes/agents.js";
import { getAgents } from "../../src/services/agents-service.js";
import type { CrewMember } from "../../src/types/index.js";

/**
 * Creates a test Express app with the agents router mounted.
 */
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/agents", agentsRouter);
  return app;
}

/**
 * Creates a mock CrewMember for testing.
 */
function createMockAgent(overrides: Partial<CrewMember> = {}): CrewMember {
  return {
    id: "gastown_boy/nux",
    name: "nux",
    type: "polecat",
    rig: "gastown_boy",
    status: "working",
    unreadMail: 0,
    ...overrides,
  };
}

describe("agents routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe("GET /api/agents", () => {
    it("should return empty array when no agents", async () => {
      vi.mocked(getAgents).mockResolvedValue({
        success: true,
        data: [],
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return list of agents", async () => {
      const mockAgents = [
        createMockAgent({ id: "mayor", name: "mayor", type: "mayor", rig: null }),
        createMockAgent({ id: "gastown_boy/witness", name: "witness", type: "witness" }),
        createMockAgent({ id: "gastown_boy/nux", name: "nux", type: "polecat" }),
      ];

      vi.mocked(getAgents).mockResolvedValue({
        success: true,
        data: mockAgents,
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].name).toBe("mayor");
      expect(response.body.data[1].type).toBe("witness");
      expect(response.body.data[2].rig).toBe("gastown_boy");
    });

    it("should return agents with various statuses", async () => {
      const mockAgents = [
        createMockAgent({ id: "mayor", name: "mayor", status: "working", currentTask: "Managing gastown" }),
        createMockAgent({ id: "gastown_boy/nux", name: "nux", status: "idle" }),
        createMockAgent({ id: "gastown_boy/furiosa", name: "furiosa", status: "blocked" }),
        createMockAgent({ id: "deacon", name: "deacon", status: "offline" }),
      ];

      vi.mocked(getAgents).mockResolvedValue({
        success: true,
        data: mockAgents,
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(200);
      expect(response.body.data[0].status).toBe("working");
      expect(response.body.data[0].currentTask).toBe("Managing gastown");
      expect(response.body.data[1].status).toBe("idle");
      expect(response.body.data[2].status).toBe("blocked");
      expect(response.body.data[3].status).toBe("offline");
    });

    it("should include unreadMail count", async () => {
      const mockAgents = [
        createMockAgent({ id: "mayor", name: "mayor", unreadMail: 5 }),
        createMockAgent({ id: "gastown_boy/witness", name: "witness", unreadMail: 0 }),
      ];

      vi.mocked(getAgents).mockResolvedValue({
        success: true,
        data: mockAgents,
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(200);
      expect(response.body.data[0].unreadMail).toBe(5);
      expect(response.body.data[1].unreadMail).toBe(0);
    });

    it("should return 500 on service error", async () => {
      vi.mocked(getAgents).mockResolvedValue({
        success: false,
        error: { code: "CLI_ERROR", message: "gt agents list command failed" },
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INTERNAL_ERROR");
      expect(response.body.error.message).toBe("gt agents list command failed");
    });

    it("should return 500 with default message on unknown error", async () => {
      vi.mocked(getAgents).mockResolvedValue({
        success: false,
        error: undefined,
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Failed to get agents list");
    });

    it("should return agents with different types", async () => {
      const mockAgents = [
        createMockAgent({ type: "mayor" }),
        createMockAgent({ type: "deacon" }),
        createMockAgent({ type: "witness" }),
        createMockAgent({ type: "refinery" }),
        createMockAgent({ type: "crew" }),
        createMockAgent({ type: "polecat" }),
      ];

      vi.mocked(getAgents).mockResolvedValue({
        success: true,
        data: mockAgents,
      });

      const response = await request(app).get("/api/agents");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(6);
      expect(response.body.data.map((a: CrewMember) => a.type)).toEqual([
        "mayor",
        "deacon",
        "witness",
        "refinery",
        "crew",
        "polecat",
      ]);
    });
  });
});
