import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock the power-service before importing the router
vi.mock("../../src/services/power-service.js", () => ({
  getStatus: vi.fn(),
  powerUp: vi.fn(),
  powerDown: vi.fn(),
}));

import { statusRouter } from "../../src/routes/status.js";
import { getStatus } from "../../src/services/power-service.js";
import type { GastownStatus } from "../../src/types/index.js";

/**
 * Creates a test Express app with the status router mounted.
 */
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/status", statusRouter);
  return app;
}

/**
 * Creates a mock GastownStatus for testing.
 */
function createMockStatus(overrides: Partial<GastownStatus> = {}): GastownStatus {
  return {
    powerState: "running",
    town: {
      name: "gastown_boy",
      root: "/Users/test/gt/gastown_boy",
    },
    operator: {
      name: "Test User",
      email: "test@example.com",
      unreadMail: 0,
    },
    infrastructure: {
      mayor: {
        name: "mayor",
        running: true,
        unreadMail: 0,
      },
      deacon: {
        name: "deacon",
        running: true,
        unreadMail: 0,
      },
      daemon: {
        name: "daemon",
        running: true,
        unreadMail: 0,
      },
    },
    rigs: [],
    fetchedAt: "2026-01-12T12:00:00Z",
    ...overrides,
  };
}

describe("status routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe("GET /api/status", () => {
    it("should return gastown status when running", async () => {
      const mockStatus = createMockStatus({ powerState: "running" });

      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.powerState).toBe("running");
      expect(response.body.data.town.name).toBe("gastown_boy");
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return gastown status when stopped", async () => {
      const mockStatus = createMockStatus({ powerState: "stopped" });

      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.powerState).toBe("stopped");
    });

    it("should return status with infrastructure agents", async () => {
      const mockStatus = createMockStatus({
        infrastructure: {
          mayor: {
            name: "mayor",
            running: true,
            unreadMail: 5,
            state: "working",
          },
          deacon: {
            name: "deacon",
            running: true,
            unreadMail: 0,
            state: "idle",
          },
          daemon: {
            name: "daemon",
            running: true,
            unreadMail: 0,
          },
        },
      });

      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(200);
      expect(response.body.data.infrastructure.mayor.running).toBe(true);
      expect(response.body.data.infrastructure.mayor.unreadMail).toBe(5);
      expect(response.body.data.infrastructure.deacon.state).toBe("idle");
    });

    it("should return status with rig information", async () => {
      const mockStatus = createMockStatus({
        rigs: [
          {
            name: "gastown_boy",
            path: "/Users/test/gt/gastown_boy/refinery/rig",
            witness: {
              name: "witness",
              running: true,
              unreadMail: 0,
            },
            refinery: {
              name: "refinery",
              running: true,
              unreadMail: 2,
            },
            crew: [],
            polecats: [
              {
                name: "furiosa",
                running: true,
                unreadMail: 0,
                state: "working",
              },
            ],
            mergeQueue: {
              pending: 3,
              inFlight: 1,
              blocked: 0,
            },
          },
        ],
      });

      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(200);
      expect(response.body.data.rigs).toHaveLength(1);
      expect(response.body.data.rigs[0].name).toBe("gastown_boy");
      expect(response.body.data.rigs[0].polecats).toHaveLength(1);
      expect(response.body.data.rigs[0].mergeQueue.pending).toBe(3);
    });

    it("should return 500 on service error", async () => {
      vi.mocked(getStatus).mockResolvedValue({
        success: false,
        error: { code: "CLI_ERROR", message: "gt status command failed" },
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INTERNAL_ERROR");
      expect(response.body.error.message).toBe("gt status command failed");
    });

    it("should return 500 with default message on unknown error", async () => {
      vi.mocked(getStatus).mockResolvedValue({
        success: false,
        error: undefined,
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Failed to get gastown status");
    });

    it("should include operator information", async () => {
      const mockStatus = createMockStatus({
        operator: {
          name: "Will Saults",
          email: "will@saults.io",
          unreadMail: 10,
        },
      });

      vi.mocked(getStatus).mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      const response = await request(app).get("/api/status");

      expect(response.status).toBe(200);
      expect(response.body.data.operator.name).toBe("Will Saults");
      expect(response.body.data.operator.email).toBe("will@saults.io");
      expect(response.body.data.operator.unreadMail).toBe(10);
    });
  });
});
