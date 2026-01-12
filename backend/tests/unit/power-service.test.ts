import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the gt-executor before importing the module under test
vi.mock("../../src/services/gt-executor.js", () => ({
  gt: {
    up: vi.fn(),
    down: vi.fn(),
    status: vi.fn(),
  },
}));

import { gt } from "../../src/services/gt-executor.js";
import { powerUp, powerDown, getStatus } from "../../src/services/power-service.js";
import type { GastownStatus, PowerState } from "../../src/types/index.js";

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
    fetchedAt: "2026-01-11T12:00:00Z",
    ...overrides,
  };
}

describe("power-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getStatus", () => {
    it("should return gastown status successfully", async () => {
      const mockStatus = createMockStatus({ powerState: "running" });

      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: mockStatus,
        exitCode: 0,
      });

      const result = await getStatus();

      expect(result.success).toBe(true);
      expect(result.data?.powerState).toBe("running");
      expect(result.data?.town.name).toBe("gastown");
    });

    it("should return stopped state when gastown is not running", async () => {
      const mockStatus = createMockStatus({ powerState: "stopped" });

      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: mockStatus,
        exitCode: 0,
      });

      const result = await getStatus();

      expect(result.success).toBe(true);
      expect(result.data?.powerState).toBe("stopped");
    });

    it("should propagate errors from gt executor", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: false,
        error: {
          code: "COMMAND_FAILED",
          message: "Unable to connect to gastown",
        },
        exitCode: 1,
      });

      const result = await getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("COMMAND_FAILED");
      expect(result.error?.message).toBe("Unable to connect to gastown");
    });

    it("should handle malformed status response", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: { invalid: "data" }, // Missing required fields
        exitCode: 0,
      });

      const result = await getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_RESPONSE");
    });
  });

  describe("powerUp", () => {
    it("should start gastown successfully", async () => {
      vi.mocked(gt.up).mockResolvedValue({
        success: true,
        data: "Gastown started",
        exitCode: 0,
      });

      const result = await powerUp();

      expect(result.success).toBe(true);
      expect(gt.up).toHaveBeenCalledTimes(1);
    });

    it("should return previous and new state on success", async () => {
      // First get current state (stopped)
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "stopped" }),
        exitCode: 0,
      });

      vi.mocked(gt.up).mockResolvedValue({
        success: true,
        data: "Gastown started",
        exitCode: 0,
      });

      const result = await powerUp();

      expect(result.success).toBe(true);
      expect(result.data?.previousState).toBe("stopped");
      expect(result.data?.newState).toBe("starting");
    });

    it("should return error when already running", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "running" }),
        exitCode: 0,
      });

      const result = await powerUp();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("ALREADY_RUNNING");
      expect(result.error?.message).toContain("already running");
    });

    it("should propagate startup errors", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "stopped" }),
        exitCode: 0,
      });

      vi.mocked(gt.up).mockResolvedValue({
        success: false,
        error: {
          code: "STARTUP_FAILED",
          message: "Failed to start daemon",
        },
        exitCode: 1,
      });

      const result = await powerUp();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("STARTUP_FAILED");
    });

    it("should handle status check failure gracefully", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: false,
        error: {
          code: "CONNECTION_ERROR",
          message: "Cannot connect",
        },
        exitCode: 1,
      });

      // Even if status fails, we should attempt to start
      vi.mocked(gt.up).mockResolvedValue({
        success: true,
        data: "Gastown started",
        exitCode: 0,
      });

      const result = await powerUp();

      expect(result.success).toBe(true);
      expect(gt.up).toHaveBeenCalled();
    });
  });

  describe("powerDown", () => {
    it("should stop gastown successfully", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "running" }),
        exitCode: 0,
      });

      vi.mocked(gt.down).mockResolvedValue({
        success: true,
        data: "Gastown stopped",
        exitCode: 0,
      });

      const result = await powerDown();

      expect(result.success).toBe(true);
      expect(gt.down).toHaveBeenCalledTimes(1);
    });

    it("should return previous and new state on success", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "running" }),
        exitCode: 0,
      });

      vi.mocked(gt.down).mockResolvedValue({
        success: true,
        data: "Gastown stopped",
        exitCode: 0,
      });

      const result = await powerDown();

      expect(result.success).toBe(true);
      expect(result.data?.previousState).toBe("running");
      expect(result.data?.newState).toBe("stopping");
    });

    it("should return error when already stopped", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "stopped" }),
        exitCode: 0,
      });

      const result = await powerDown();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("ALREADY_STOPPED");
      expect(result.error?.message).toContain("already stopped");
    });

    it("should propagate shutdown errors", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "running" }),
        exitCode: 0,
      });

      vi.mocked(gt.down).mockResolvedValue({
        success: false,
        error: {
          code: "SHUTDOWN_FAILED",
          message: "Failed to stop daemon",
        },
        exitCode: 1,
      });

      const result = await powerDown();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("SHUTDOWN_FAILED");
    });

    it("should allow force stop during starting state", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: true,
        data: createMockStatus({ powerState: "starting" }),
        exitCode: 0,
      });

      vi.mocked(gt.down).mockResolvedValue({
        success: true,
        data: "Gastown stopped",
        exitCode: 0,
      });

      const result = await powerDown();

      expect(result.success).toBe(true);
      expect(gt.down).toHaveBeenCalled();
    });

    it("should handle status check failure gracefully during shutdown", async () => {
      vi.mocked(gt.status).mockResolvedValue({
        success: false,
        error: {
          code: "CONNECTION_ERROR",
          message: "Cannot connect",
        },
        exitCode: 1,
      });

      // Even if status fails, we should attempt to stop (failsafe)
      vi.mocked(gt.down).mockResolvedValue({
        success: true,
        data: "Gastown stopped",
        exitCode: 0,
      });

      const result = await powerDown();

      expect(result.success).toBe(true);
      expect(gt.down).toHaveBeenCalled();
    });
  });
});
