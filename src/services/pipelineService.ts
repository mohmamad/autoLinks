import { customAlphabet } from "nanoid";

import { BadRequestError } from "../api/errors.js";
import {
  pipelineRepository,
  subscriberRepository,
} from "../repositories/index.js";
import { assertUrlAllowed } from "./httpClient.js";
import type { PiplineRequest } from "../types/pipline.types.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const WEBHOOK_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const WEBHOOK_ID_LENGTH = 12;

export class PipelineService {
  private generateWebhookId = customAlphabet(
    WEBHOOK_ID_ALPHABET,
    WEBHOOK_ID_LENGTH,
  );

  constructor(
    private pipelines = pipelineRepository,
    private subscribers = subscriberRepository,
  ) {}

  async createPipeline(userId: string, request: PiplineRequest) {
    if (!isValidString(request.name) || !isValidString(request.description)) {
      throw new BadRequestError("name and description are required");
    }

    if (!Array.isArray(request.subscribers) || request.subscribers.length === 0) {
      throw new BadRequestError("Subscribers are required");
    }

    const webhookId = this.generateWebhookId();

    const pipeline = await this.pipelines.create({
      name: request.name.trim(),
      description: request.description.trim(),
      webhook_id: webhookId,
      user_id: userId,
    });

    for (const subscriber of request.subscribers) {
      await this.createSubscriber(pipeline.id, subscriber);
    }

    return {
      pipeline,
      webhookUrl: `http://localhost:8080/autolinks/${webhookId}`,
    };
  }

  async getPipelineByWebhookId(webhookId: string) {
    return this.pipelines.findByWebhookId(webhookId);
  }

  async listSubscribers(pipelineId: string) {
    return this.subscribers.listByPipelineId(pipelineId);
  }

  private async createSubscriber(
    pipelineId: string,
    subscriber: PiplineRequest["subscribers"][number],
  ) {
    switch (subscriber.type) {
      case "http request":
        await this.createHttpSubscriber(pipelineId, subscriber.config);
        return;
      case "email":
        await this.createEmailSubscriber(pipelineId, subscriber.config);
        return;
      case "slack":
        await this.createSlackSubscriber(pipelineId, subscriber.config);
        return;
      default:
        throw new BadRequestError("Invalid subscriber type");
    }
  }

  private async createHttpSubscriber(
    pipelineId: string,
    config: { url: string; method: string; headers?: Record<string, string> },
  ) {
    if (!isValidString(config.url)) {
      throw new BadRequestError("Subscriber url is required");
    }
    await assertUrlAllowed(config.url);
    if (!this.isValidMethod(config.method)) {
      throw new BadRequestError("Invalid http method");
    }

    await this.subscribers.create({
      pipeline_id: pipelineId,
      type: "http request",
      config: {
        url: config.url,
        method: config.method,
        headers: config.headers,
      },
    });
  }

  private async createEmailSubscriber(
    pipelineId: string,
    config: {
      to: string;
      subject?: string;
      from?: string;
      cc?: string | string[];
      bcc?: string | string[];
      text?: string;
      html?: string;
      category?: string;
    },
  ) {
    if (!isValidString(config.to)) {
      throw new BadRequestError("Email subscriber must include a recipient");
    }

    await this.subscribers.create({
      pipeline_id: pipelineId,
      type: "email",
      config,
    });
  }

  private async createSlackSubscriber(
    pipelineId: string,
    config: { webhookUrl: string },
  ) {
    if (!isValidString(config.webhookUrl)) {
      throw new BadRequestError("Slack webhookUrl is required");
    }

    await this.subscribers.create({
      pipeline_id: pipelineId,
      type: "slack",
      config,
    });
  }

  private isValidMethod(
    method: string,
  ): method is "GET" | "POST" | "PUT" | "DELETE" {
    return ["GET", "POST", "PUT", "DELETE"].includes(method as any);
  }
}

export const pipelineService = new PipelineService();
