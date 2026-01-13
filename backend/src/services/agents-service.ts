/**
 * Agents service for gastown-boy.
 *
 * Retrieves and transforms agent information into CrewMember format
 * for the dashboard display.
 */

import { gt } from "./gt-executor.js";
import type { CrewMember, CrewMemberStatus, AgentType } from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for agents service operations.
 */
export interface AgentsServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Raw agent data from gt agents list command.
 */
interface RawAgent {
  name: string;
  type: string;
  rig?: string;
  running: boolean;
  state?: string;
  currentTask?: string;
  unreadMail: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps raw agent type string to AgentType enum.
 */
function mapAgentType(type: string): AgentType {
  const typeMap: Record<string, AgentType> = {
    mayor: "mayor",
    deacon: "deacon",
    witness: "witness",
    refinery: "refinery",
    crew: "crew",
    polecat: "polecat",
  };
  return typeMap[type.toLowerCase()] ?? "crew";
}

/**
 * Maps raw state string to CrewMemberStatus.
 */
function mapStatus(running: boolean, state?: string): CrewMemberStatus {
  if (!running) return "offline";
  if (!state) return "idle";

  const stateMap: Record<string, CrewMemberStatus> = {
    idle: "idle",
    working: "working",
    blocked: "blocked",
    stuck: "stuck",
    "awaiting-gate": "blocked",
  };
  return stateMap[state.toLowerCase()] ?? "idle";
}

/**
 * Transforms raw agent data to CrewMember format.
 */
function transformAgent(raw: RawAgent): CrewMember {
  return {
    id: raw.rig ? `${raw.rig}/${raw.name}` : raw.name,
    name: raw.name,
    type: mapAgentType(raw.type),
    rig: raw.rig ?? null,
    status: mapStatus(raw.running, raw.state),
    currentTask: raw.currentTask,
    unreadMail: raw.unreadMail,
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Gets all agents as CrewMember list for the dashboard.
 */
export async function getAgents(): Promise<AgentsServiceResult<CrewMember[]>> {
  const result = await gt.agents.list<RawAgent[]>();

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "AGENTS_ERROR",
        message: result.error?.message ?? "Failed to get agents list",
      },
    };
  }

  // Handle case where data might be undefined or not an array
  if (!result.data || !Array.isArray(result.data)) {
    return {
      success: true,
      data: [],
    };
  }

  const crewMembers = result.data.map(transformAgent);

  return { success: true, data: crewMembers };
}
