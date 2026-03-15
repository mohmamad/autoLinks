
import { db } from "../index.js";
import { jobs } from "../schema.js";

export async function addJob(input: typeof jobs.$inferInsert) {
  const [job] = await db.insert(jobs).values(input).returning();
  return job;
}
