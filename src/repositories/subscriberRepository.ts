import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { subscripers } from "../db/schema.js";

export class SubscriberRepository {
  async create(input: typeof subscripers.$inferInsert) {
    const [subscriber] = await db.insert(subscripers).values(input).returning();
    return subscriber;
  }

  async getSubscriperByPipelineId(pipelineId: string) {
    const records = await db
      .select()
      .from(subscripers)
      .where(eq(subscripers.pipeline_id, pipelineId));
    return records;
  }

  async deleteByPipelineId(pipelineId: string) {
    await db.delete(subscripers).where(eq(subscripers.pipeline_id, pipelineId));
  }
}

export const subscriberRepository = new SubscriberRepository();
