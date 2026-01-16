/**
 * Beads route for the gastown-boy API.
 *
 * Endpoints:
 * - GET /api/beads - List beads for the rig
 */

import { Router } from "express";
import { listBeads } from "../services/beads-service.js";
import { success, internalError } from "../utils/responses.js";

export const beadsRouter = Router();

/**
 * GET /api/beads
 * Returns beads for the beads tab.
 *
 * IMPORTANT: gastown_boy is the dashboard for ALL of Gas Town.
 * By default, we show ALL beads from the town, not filtered by rig.
 * See .claude/rules/00-critical-scope.md for context.
 *
 * Query params:
 * - rig: Filter by rig (optional - omit to show all beads)
 * - status: "open" | "closed" | "all" (default: open)
 * - type: Filter by bead type (e.g., "task", "bug", "feature")
 * - limit: Max results (default: 100)
 */
beadsRouter.get("/", async (req, res) => {
  // No default rig filter - show ALL town beads
  const rig = req.query["rig"] as string | undefined;
  const statusParam = req.query["status"] as "open" | "closed" | "all" | undefined;
  const typeParam = req.query["type"] as string | undefined;
  const limitStr = req.query["limit"] as string | undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : 100;

  const result = await listBeads({
    ...(rig && { rig }), // Only filter by rig if explicitly requested
    ...(typeParam && { type: typeParam }),
    ...(statusParam && { status: statusParam }),
    limit,
  });

  if (!result.success) {
    return res.status(500).json(
      internalError(result.error?.message ?? "Failed to list beads")
    );
  }

  return res.json(success(result.data));
});
