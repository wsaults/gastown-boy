/**
 * Problem detection heuristics for agent health monitoring.
 *
 * Detects operational issues by analyzing agent state and event history:
 * - Zombie: dead/crashed session with hooked (assigned) work
 * - Stalled: running agent with hooked work but no activity for 15+ minutes
 * - GUPP violation: running agent with hooked work but no activity for 30+ minutes
 */

import type { AgentRuntimeInfo } from "./agent-data.js";
import type { GtEvent } from "./events-service.js";

// =============================================================================
// Types
// =============================================================================

export interface AgentProblem {
  type: "gupp_violation" | "stalled" | "zombie";
  detail: string;
  minutesIdle?: number;
}

// =============================================================================
// Thresholds
// =============================================================================

const STALLED_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
const GUPP_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// =============================================================================
// Core Detection
// =============================================================================

/**
 * Detect problems for a single agent given its state and last known activity.
 *
 * Pure function - no I/O. Takes a pre-computed lastActivity timestamp
 * (from buildLastActivityMap) so callers control the event source.
 */
export function detectAgentProblems(
  agent: AgentRuntimeInfo,
  lastActivity: Date | null,
  now: Date = new Date()
): AgentProblem[] {
  const problems: AgentProblem[] = [];

  // Zombie: dead session with hooked work
  if (!agent.running && agent.hookBead) {
    problems.push({
      type: "zombie",
      detail: `Dead session with hooked work: ${agent.hookBead}`,
    });
    return problems;
  }

  // Timing checks only apply to running agents with hooked work
  if (!agent.running || !agent.hookBead) return problems;

  // No activity data - can't do timing checks
  if (!lastActivity) return problems;

  const idleMs = now.getTime() - lastActivity.getTime();
  const minutesIdle = Math.floor(idleMs / 60000);

  // GUPP violation: hooked work + 30m no progress (supersedes stalled)
  if (idleMs >= GUPP_THRESHOLD_MS) {
    problems.push({
      type: "gupp_violation",
      detail: `No activity for ${minutesIdle}m with hooked work`,
      minutesIdle,
    });
  }
  // Stalled: hooked work + 15m no progress
  else if (idleMs >= STALLED_THRESHOLD_MS) {
    problems.push({
      type: "stalled",
      detail: `No activity for ${minutesIdle}m with hooked work`,
      minutesIdle,
    });
  }

  return problems;
}

// =============================================================================
// Event Analysis
// =============================================================================

/**
 * Build a map of actor address to their most recent event timestamp.
 * Used by detectAgentProblems for timing-based heuristics.
 */
export function buildLastActivityMap(events: GtEvent[]): Map<string, Date> {
  const lastActivity = new Map<string, Date>();

  for (const event of events) {
    const ts = new Date(event.ts);
    const existing = lastActivity.get(event.actor);
    if (!existing || ts > existing) {
      lastActivity.set(event.actor, ts);
    }
  }

  return lastActivity;
}
