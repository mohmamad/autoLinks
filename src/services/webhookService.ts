import { NotFoundError } from "../api/errors.js";
import { pipelineService } from "./pipelineService.js";
import { jobService } from "./jobService.js";

export class WebhookService {
  constructor(
    private pipelines = pipelineService,
    private jobs = jobService,
  ) {}

  async enqueueWebhookPayload(webhookId: string, payload: unknown) {
    const pipeline = await this.pipelines.getPipelineByWebhookId(webhookId);
    if (!pipeline) {
      throw new NotFoundError("Pipeline not found");
    }

    await this.jobs.enqueueJob({
      payload: payload as any,
      pipline_id: pipeline.id,
    });

    return pipeline;
  }
}

export const webhookService = new WebhookService();
