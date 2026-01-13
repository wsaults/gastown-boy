/**
 * Agents service for gastown-boy.
 *
 * Retrieves agent information from gastown status and transforms
 * it into CrewMember format for the dashboard.
 */

import { getStatus } from "./power-service.js";
import type {
  CrewMember,
  AgentStatus,
  AgentType,
  CrewMemberStatus,
} from "../types/index.js";

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps AgentStatus.state to CrewMemberStatus.
 */
function mapAgentState(
  agent: AgentStatus,
  isRunning: boolean
): CrewMemberStatus {
  if (!isRunning || !agent.running) {
    return "offline";
  }
  if (agent.state === "stuck") {
    return "stuck";
  }
  if (agent.state === "awaiting-gate") {
    return "blocked";
  }
  if (agent.state === "working") {
    return "working";
  }
  return "idle";
}

/**
 * Transforms an AgentStatus to a CrewMember.
 */
function toCrewMember(
  agent: AgentStatus,
  type: AgentType,
  rig: string | null,
  isRunning: boolean
): CrewMember {
  const currentTask = agent.pinnedWork?.[0];
  return {
    id: rig ? `${rig}/${agent.name}` : agent.name,
    name: agent.name,
    type,
    rig,
    status: mapAgentState(agent, isRunning),
    ...(currentTask !== undefined && { currentTask }),
    unreadMail: agent.unreadMail,
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Gets all agents as CrewMember objects.
 *
 * Extracts agent information from the gastown status response
 * and transforms it into the CrewMember format for the UI.
 */
export async function getAgents(): Promise<AgentsServiceResult<CrewMember[]>> {
  const statusResult = await getStatus();

  if (!statusResult.success || !statusResult.data) {
    return {
      success: false,
      error: {
        code: statusResult.error?.code ?? "STATUS_ERROR",
        message: statusResult.error?.message ?? "Failed to get gastown status",
      },
    };
  }

  const status = statusResult.data;
  const isRunning = status.powerState === "running";
  const agents: CrewMember[] = [];

  // Add infrastructure agents (town-level, no rig)
  const { infrastructure } = status;

  agents.push(toCrewMember(infrastructure.mayor, "mayor", null, isRunning));
  agents.push(toCrewMember(infrastructure.deacon, "deacon", null, isRunning));

  // Add rig-level agents
  for (const rig of status.rigs) {
    // Witness
    agents.push(toCrewMember(rig.witness, "witness", rig.name, isRunning));

    // Refinery
    agents.push(toCrewMember(rig.refinery, "refinery", rig.name, isRunning));

    // Crew members
    for (const crew of rig.crew) {
      agents.push(toCrewMember(crew, "crew", rig.name, isRunning));
    }

    // Polecats
    for (const polecat of rig.polecats) {
      agents.push(toCrewMember(polecat, "polecat", rig.name, isRunning));
    }
  }

  return { success: true, data: agents };
}
