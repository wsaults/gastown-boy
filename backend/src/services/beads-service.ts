/**
 * Beads service for gastown-boy.
 *
 * Retrieves beads filtered by rig for display in the UI.
 */

import { execBd, type BeadsIssue } from "./bd-client.js";
import { resolveTownRoot } from "./gastown-workspace.js";
import { resolveBeadsDir } from "./bd-client.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Bead display info for the UI.
 */
export interface BeadInfo {
  id: string;
  title: string;
  status: string;
  priority: number;
  type: string;
  assignee: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Result type for beads service operations.
 */
export interface BeadsServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Options for listing beads.
 */
export interface ListBeadsOptions {
  rig?: string;
  status?: "open" | "closed" | "all";
  type?: string;
  limit?: number;
}

// ============================================================================
// Helpers
// ============================================================================

function transformBead(issue: BeadsIssue): BeadInfo {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    type: issue.issue_type,
    assignee: issue.assignee ?? null,
    labels: issue.labels ?? [],
    createdAt: issue.created_at,
    updatedAt: issue.updated_at ?? null,
  };
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Gets beads for display in the UI.
 * Optionally filtered by rig and status.
 */
export async function listBeads(
  options: ListBeadsOptions = {}
): Promise<BeadsServiceResult<BeadInfo[]>> {
  try {
    const townRoot = resolveTownRoot();
    const beadsDir = resolveBeadsDir(townRoot);

    const args = ["list", "--json"];

    // Filter by rig label if specified
    if (options.rig) {
      args.push("--label", `rig:${options.rig}`);
    }

    // Handle status filter
    if (options.status === "all") {
      args.push("--all");
    } else if (options.status === "closed") {
      args.push("--status", "closed");
    }
    // Default is open issues only

    // Filter by type if specified
    if (options.type) {
      args.push("--type", options.type);
    }

    // Limit results
    if (options.limit) {
      args.push("--limit", options.limit.toString());
    }

    const result = await execBd<BeadsIssue[]>(args, {
      cwd: townRoot,
      beadsDir,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          code: "BEADS_ERROR",
          message: result.error?.message ?? "Failed to list beads",
        },
      };
    }

    const beads = (result.data ?? []).map(transformBead);

    // Sort by priority (lower = higher priority), then by updated date
    beads.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const aDate = a.updatedAt ?? a.createdAt;
      const bDate = b.updatedAt ?? b.createdAt;
      return bDate.localeCompare(aDate); // Newest first
    });

    return { success: true, data: beads };
  } catch (err) {
    return {
      success: false,
      error: {
        code: "BEADS_ERROR",
        message: err instanceof Error ? err.message : "Failed to list beads",
      },
    };
  }
}
