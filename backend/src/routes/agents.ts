/**
 * Agents route for the gastown-boy API.
 *
 * Endpoints:
 * - GET /api/agents - Get all agents as crew members
 */

import { Router } from "express";
import { getAgents } from "../services/agents-service.js";
import { success, internalError } from "../utils/responses.js";

export const agentsRouter = Router();

/**
 * GET /api/agents
 * Returns all agents (mayor, deacon, witnesses, refineries, crew, polecats)
 * transformed into CrewMember format for the dashboard.
 */
agentsRouter.get("/", async (_req, res) => {
  const result = await getAgents();

  if (!result.success) {
    return res.status(500).json(
      internalError(result.error?.message ?? "Failed to get agents")
    );
  }

  return res.json(success(result.data));
});
