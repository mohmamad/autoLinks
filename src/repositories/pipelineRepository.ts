import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { jobs, pipelines } from "../db/schema.js";

export class PipelineRepository {
  async create(input: typeof pipelines.$inferInsert) {
    const [record] = await db.insert(pipelines).values(input).returning();
    return record;
  }

  async getPipelineByWebhookId(webhookId: string) {
    const [record] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.webhook_id, webhookId))
      .limit(1);
    return record ?? null;
  }

  async getPipelineById(pipelineId: string) {
    const [record] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.id, pipelineId))
      .limit(1);
    return record ?? null;
  }

  async getPipelinesByUserId(userId: string) {
    const records = await db
      .select({
        id: pipelines.id,
        name: pipelines.name,
        description: pipelines.description,
        weghookId: pipelines.webhook_id,
      })
      .from(pipelines)
      .where(eq(pipelines.user_id, userId));
    return records;
  }

  async updatePipeline(
    pipelineId: string,
    userId: string,
    input: { name: string; description: string },
  ) {
    const [record] = await db
      .update(pipelines)
      .set({
        name: input.name,
        description: input.description,
        updated_at: new Date(),
      })
      .where(and(eq(pipelines.id, pipelineId), eq(pipelines.user_id, userId)))
      .returning();
    return record ?? null;
  }

  async deletePipeline(pipelineId: string, userId: string) {
    const [record] = await db
      .delete(pipelines)
      .where(and(eq(pipelines.id, pipelineId), eq(pipelines.user_id, userId)))
      .returning();
    return record ?? null;
  }
}

export const pipelineRepository = new PipelineRepository();
