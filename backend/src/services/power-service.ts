/**
 * Power service for gastown-boy.
 *
 * Controls gastown startup/shutdown and status queries,
 * wrapping the lower-level gt-executor power commands.
 */

import { gt } from "./gt-executor.js";
import type { GastownStatus, PowerState, AgentStatus, RigStatus } from "../types/index.js";

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

/**
 * Raw agent data from gt status --json.
 */
interface RawStatusAgent {
  name: string;
  address: string;
  session: string;
  role: string;
  running: boolean;
  has_work: boolean;
  state?: string;
  unread_mail: number;
  first_subject?: string;
}

/**
 * Raw rig data from gt status --json.
 */
interface RawStatusRig {
  name: string;
  polecat_count: number;
  crew_count: number;
  has_witness: boolean;
  has_refinery: boolean;
  agents: RawStatusAgent[];
}

/**
 * Raw status response from gt status --json.
 */
interface RawGtStatus {
  name: string;
  location: string;
  overseer: {
    name: string;
    email: string;
    username: string;
    source: string;
    unread_mail: number;
  };
  agents: RawStatusAgent[];
  rigs: RawStatusRig[];
}

// ============================================================================
// Transformation Helpers
// ============================================================================

/**
 * Transform raw agent to AgentStatus format.
 */
function transformAgent(raw: RawStatusAgent): AgentStatus {
  const result: AgentStatus = {
    name: raw.name,
    running: raw.running,
    unreadMail: raw.unread_mail,
  };
  if (raw.first_subject !== undefined) {
    result.firstMessageSubject = raw.first_subject;
  }
  if (raw.state !== undefined) {
    result.state = raw.state as "idle" | "working" | "stuck" | "awaiting-gate";
  }
  return result;
}

/**
 * Transform raw rig to RigStatus format.
 */
function transformRig(raw: RawStatusRig): RigStatus {
  const agents = raw.agents || [];
  const witness = agents.find((a) => a.role === "witness");
  const refinery = agents.find((a) => a.role === "refinery");
  const crew = agents.filter((a) => a.role === "crew");
  const polecats = agents.filter((a) => a.role === "polecat");

  const defaultAgent: AgentStatus = {
    name: "unknown",
    running: false,
    unreadMail: 0,
  };

  return {
    name: raw.name,
    path: "", // Not provided by gt status
    witness: witness ? transformAgent(witness) : defaultAgent,
    refinery: refinery ? transformAgent(refinery) : defaultAgent,
    crew: crew.map(transformAgent),
    polecats: polecats.map(transformAgent),
    mergeQueue: { pending: 0, inFlight: 0, blocked: 0 }, // Not provided by gt status
  };
}

/**
 * Derive power state from agent running status.
 */
function derivePowerState(agents: RawStatusAgent[]): PowerState {
  const mayor = agents.find((a) => a.name === "mayor");
  if (mayor?.running) return "running";
  return "stopped";
}

/**
 * Transform raw gt status output to GastownStatus format.
 */
function transformStatus(raw: RawGtStatus): GastownStatus {
  const agents = raw.agents || [];
  const mayor = agents.find((a) => a.name === "mayor");
  const deacon = agents.find((a) => a.name === "deacon");

  const defaultAgent: AgentStatus = {
    name: "unknown",
    running: false,
    unreadMail: 0,
  };

  return {
    powerState: derivePowerState(agents),
    town: {
      name: raw.name,
      root: raw.location,
    },
    operator: {
      name: raw.overseer.name,
      email: raw.overseer.email,
      unreadMail: raw.overseer.unread_mail,
    },
    infrastructure: {
      mayor: mayor ? transformAgent(mayor) : defaultAgent,
      deacon: deacon ? transformAgent(deacon) : defaultAgent,
      daemon: defaultAgent, // Daemon not in gt status output
    },
    rigs: (raw.rigs || []).map(transformRig),
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Power Service Functions
// ============================================================================

/**
 * Gets the current gastown status.
 */
export async function getStatus(): Promise<PowerServiceResult<GastownStatus>> {
  const result = await gt.status<RawGtStatus>();

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "STATUS_ERROR",
        message: result.error?.message ?? "Failed to get gastown status",
      },
    };
  }

  if (!result.data) {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Empty status response",
      },
    };
  }

  // Transform the raw status to expected format
  const transformed = transformStatus(result.data);
  return { success: true, data: transformed };
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
