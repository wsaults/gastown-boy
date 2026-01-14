
import { Router } from "express";
import { listConvoys } from "../services/convoys-service.js";
import { success, internalError } from "../utils/responses.js";

export const convoysRouter = Router();

/**
 * GET /api/convoys
 * Returns active convoys
 */
convoysRouter.get("/", async (_req, res) => {
  const result = await listConvoys();

  if (!result.success) {
    return res.status(500).json(
      internalError(result.error?.message ?? "Failed to list convoys")
    );
  }

  return res.json(success(result.data));
});
