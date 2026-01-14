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
 * Raw agent data from gt status --json command.
 */
interface StatusAgent {
  name: string;
  address: string;
  role: string;
  running: boolean;
  state?: string;
  has_work?: boolean;
  unread_mail: number;
  first_subject?: string;
}

/**
 * Rig data from gt status --json command.
 */
interface StatusRig {
  name: string;
  agents: StatusAgent[];
  crews?: string[];
  polecats?: string[] | null;
}

/**
 * Full status response from gt status --json.
 */
interface StatusResponse {
  name: string;
  agents: StatusAgent[];
  rigs: StatusRig[];
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
 * Extracts rig name from agent address.
 * e.g., "gastown/crew/carl" -> "gastown", "mayor/" -> null
 */
function extractRig(address: string): string | null {
  // Address format: "rigname/role" or "rigname/crew/name" or "mayor/"
  const parts = address.split("/");
  const rigName = parts[0];
  if (rigName && parts.length >= 2 && rigName !== "mayor" && rigName !== "deacon") {
    return rigName;
  }
  return null;
}

/**
 * Transforms status agent data to CrewMember format.
 */
function transformStatusAgent(agent: StatusAgent): CrewMember {
  const rig = extractRig(agent.address);
  const result: CrewMember = {
    id: agent.address,
    name: agent.name,
    type: mapAgentType(agent.role),
    rig,
    status: mapStatus(agent.running, agent.state),
    unreadMail: agent.unread_mail,
  };
  if (agent.first_subject) {
    result.currentTask = agent.first_subject;
  }
  return result;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Gets all agents as CrewMember list for the dashboard.
 * Uses gt status --json which includes mail counts.
 */
export async function getAgents(): Promise<AgentsServiceResult<CrewMember[]>> {
  const result = await gt.status<StatusResponse>();

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "AGENTS_ERROR",
        message: result.error?.message ?? "Failed to get status",
      },
    };
  }

  // Handle case where data might be undefined
  if (!result.data) {
    return {
      success: true,
      data: [],
    };
  }

  const allAgents: StatusAgent[] = [];

  // Add top-level agents (mayor, deacon)
  if (result.data.agents && Array.isArray(result.data.agents)) {
    allAgents.push(...result.data.agents);
  }

  // Add agents from each rig
  if (result.data.rigs && Array.isArray(result.data.rigs)) {
    for (const rig of result.data.rigs) {
      if (rig.agents && Array.isArray(rig.agents)) {
        allAgents.push(...rig.agents);
      }
    }
  }

  const crewMembers = allAgents.map(transformStatusAgent);

  return { success: true, data: crewMembers };
}
