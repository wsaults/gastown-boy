/**
 * Power service for gastown-boy.
 *
 * Controls gastown startup/shutdown and status queries,
 * wrapping the lower-level gt-executor power commands.
 */

import { gt } from "./gt-executor.js";
import type { GastownStatus, PowerState } from "../types/index.js";
import { GastownStatusSchema } from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for power service operations.
 */
export interface PowerServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Result data for power state transitions.
 */
export interface PowerTransitionResult {
  previousState: PowerState;
  newState: PowerState;
}

// ============================================================================
// Power Service Functions
// ============================================================================

/**
 * Gets the current gastown status.
 */
export async function getStatus(): Promise<PowerServiceResult<GastownStatus>> {
  const result = await gt.status<GastownStatus>();

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "STATUS_ERROR",
        message: result.error?.message ?? "Failed to get gastown status",
      },
    };
  }

  // Validate response structure
  const parseResult = GastownStatusSchema.safeParse(result.data);
  if (!parseResult.success) {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Invalid status response format",
      },
    };
  }

  return { success: true, data: result.data };
}

/**
 * Starts gastown (power up).
 *
 * Checks current state first to prevent redundant starts,
 * but will attempt startup even if status check fails (failsafe).
 */
export async function powerUp(): Promise<PowerServiceResult<PowerTransitionResult>> {
  // Get current state (best-effort)
  const statusResult = await getStatus();
  const currentState: PowerState | undefined = statusResult.data?.powerState;

  // If already running, return error
  if (currentState === "running") {
    return {
      success: false,
      error: {
        code: "ALREADY_RUNNING",
        message: "Gastown is already running",
      },
    };
  }

  // Attempt to start
  const upResult = await gt.up();

  if (!upResult.success) {
    return {
      success: false,
      error: {
        code: upResult.error?.code ?? "STARTUP_FAILED",
        message: upResult.error?.message ?? "Failed to start gastown",
      },
    };
  }

  return {
    success: true,
    data: {
      previousState: currentState ?? "stopped",
      newState: "starting",
    },
  };
}

/**
 * Stops gastown (power down).
 *
 * Checks current state first to prevent redundant stops,
 * but will attempt shutdown even if status check fails (failsafe).
 * Allows stopping during transitional states (starting, stopping).
 */
export async function powerDown(): Promise<PowerServiceResult<PowerTransitionResult>> {
  // Get current state (best-effort)
  const statusResult = await getStatus();
  const currentState: PowerState | undefined = statusResult.data?.powerState;

  // If already stopped, return error
  if (currentState === "stopped") {
    return {
      success: false,
      error: {
        code: "ALREADY_STOPPED",
        message: "Gastown is already stopped",
      },
    };
  }

  // Attempt to stop (allow during running, starting, or stopping states)
  const downResult = await gt.down();

  if (!downResult.success) {
    return {
      success: false,
      error: {
        code: downResult.error?.code ?? "SHUTDOWN_FAILED",
        message: downResult.error?.message ?? "Failed to stop gastown",
      },
    };
  }

  return {
    success: true,
    data: {
      previousState: currentState ?? "running",
      newState: "stopping",
    },
  };
}
