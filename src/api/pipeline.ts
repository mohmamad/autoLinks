import type { Request, Response } from "express";

import { getBearerToken } from "../auth.js";
import type { PiplineRequest } from "../types/pipline.types.js";
import { respondWithJSON } from "./json.js";
import { authService } from "../services/authService.js";
import { pipelineService } from "../services/pipelineService.js";

export async function addPipelineHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const piplineRequest: PiplineRequest = req.body as PiplineRequest;

  const token = getBearerToken(req);
  const userId = authService.verifyAccessToken(token);

  const { webhookUrl } = await pipelineService.createPipeline(
    userId,
    piplineRequest,
  );

  respondWithJSON(res, 201, webhookUrl);
}
