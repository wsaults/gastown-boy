/**
 * Agents route for the gastown-boy API.
 *
 * Endpoints:
 * - GET /api/agents - Get all agents as CrewMember list
 * - POST /api/agents/spawn-polecat - Request polecat spawn for a rig
 */

import { Router } from "express";
import { z } from "zod";
import { getAgents } from "../services/agents-service.js";
import { sendMail } from "../services/mail-service.js";
import { success, internalError, badRequest } from "../utils/responses.js";

export const agentsRouter = Router();

/**
 * GET /api/agents
 * Returns all agents in the gastown system as a CrewMember list
 * for the crew stats dashboard.
 */
agentsRouter.get("/", async (_req, res) => {
  const result = await getAgents();

  if (!result.success) {
    return res.status(500).json(
      internalError(result.error?.message ?? "Failed to get agents list")
    );
  }

  return res.json(success(result.data));
});

/**
 * Request body schema for spawn polecat endpoint.
 */
const spawnPolecatSchema = z.object({
  rig: z.string().min(1, "Rig name is required"),
});

/**
 * POST /api/agents/spawn-polecat
 * Sends a task message to the mayor requesting a new polecat spawn for a rig.
 */
agentsRouter.post("/spawn-polecat", async (req, res) => {
  const parsed = spawnPolecatSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(
      badRequest(parsed.error.issues[0]?.message ?? "Invalid request")
    );
  }

  const { rig } = parsed.data;

  const result = await sendMail({
    to: "mayor/",
    subject: `[spawn-polecat] ${rig}`,
    body: `Request from gastown-boy UI to spawn a new polecat for rig: ${rig}`,
    type: "task",
    priority: 1,
  });

  if (!result.success) {
    return res.status(500).json(
      internalError(result.error?.message ?? "Failed to send spawn request")
    );
  }

  return res.json(success({ rig, requested: true }));
});
