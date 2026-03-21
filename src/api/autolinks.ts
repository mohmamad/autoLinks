import { Request, Response } from "express";
import { respondWithJSON } from "./json.js";
import { webhookService } from "../services/webhookService.js";

export async function autolinkHandler(req: Request, res: Response) {
  const webhookId = req.params.webhookId as string;
  await webhookService.enqueueWebhookPayload(webhookId, req.body);
  respondWithJSON(res, 200, {});
}
