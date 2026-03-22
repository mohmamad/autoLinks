import type { Request, Response } from "express";

import { getBearerToken } from "../auth.js";
import type { PiplineRequest } from "../types/pipline.types.js";
import { respondWithJSON } from "./json.js";
import { authService } from "../services/authService.js";
import { pipelineService } from "../services/pipelineService.js";
import { jobService } from "../services/jobService.js";

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

export async function getPipelinesHandler(req: Request, res: Response) {
  const token = getBearerToken(req);
  const userId = authService.verifyAccessToken(token);
  const pipelines = await pipelineService.getPipelinesByUserId(userId);
  respondWithJSON(res, 200, pipelines);
}

export async function updatePipelineHandler(req: Request, res: Response) {
  const token = getBearerToken(req);
  const userId = authService.verifyAccessToken(token);
  const pipelineId = req.params.pipelineId as string;
  const request: PiplineRequest = req.body as PiplineRequest;
  const result = await pipelineService.updatePipeline(userId, pipelineId, request);
  respondWithJSON(res, 200, result);
}

export async function deletePipelineHandler(req: Request, res: Response) {
  const token = getBearerToken(req);
  const userId = authService.verifyAccessToken(token);
  const pipelineId = req.params.pipelineId as string;
  await pipelineService.deletePipeline(userId, pipelineId);
  respondWithJSON(res, 200, {});
}

export async function getPipelineJobsHandler(req: Request, res: Response) {
  const token = getBearerToken(req);
  const userId = authService.verifyAccessToken(token);
  const pipelineId = req.params.pipelineId as string;
  const jobs = await jobService.listPipelineJobsForUser(userId, pipelineId);
  respondWithJSON(res, 200, jobs);
}
