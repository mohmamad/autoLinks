import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { pipelines } from "../db/schema.js";

export class PipelineRepository {
  async create(input: typeof pipelines.$inferInsert) {
    const [record] = await db.insert(pipelines).values(input).returning();
    return record;
  }

  async findByWebhookId(webhookId: string) {
    const [record] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.webhook_id, webhookId))
      .limit(1);
    return record ?? null;
  }

  async findById(id: string) {
    const [record] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, id))
      .limit(1);
    return record ?? null;
  }
}

export const pipelineRepository = new PipelineRepository();
