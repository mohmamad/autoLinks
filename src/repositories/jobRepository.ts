import { and, desc, eq, lte } from "drizzle-orm";

import { db } from "../db/index.js";
import { jobs, pipelines } from "../db/schema.js";

export const JOB_STATUS = {
  PENDING: "pending",
  DONE: "done",
  FAILED: "failed",
  RUNNING: "running",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export class JobRepository {
  async create(input: typeof jobs.$inferInsert) {
    const [job] = await db.insert(jobs).values(input).returning();
    return job;
  }

  async getNextRunnableJob() {
    return db.transaction(async (trx) => {
      const now = new Date();
      const [jobRecord] = await trx
        .select()
        .from(jobs)
        .innerJoin(pipelines, eq(jobs.pipline_id, pipelines.id))
        .where(and(eq(jobs.status, JOB_STATUS.PENDING), lte(jobs.next_run_at, now)))
        .orderBy(desc(jobs.created_at))
        .limit(1)
        .for("update");

      if (!jobRecord) {
        return null;
      }

      await trx
        .update(jobs)
        .set({ status: JOB_STATUS.RUNNING, updated_at: new Date() })
        .where(eq(jobs.id, jobRecord.jobs.id));

      return jobRecord;
    });
  }

  async scheduleRetry(jobId: string, retryCount: number, nextRunAt: Date) {
    await db
      .update(jobs)
      .set({
        status: JOB_STATUS.PENDING,
        retry_count: retryCount,
        next_run_at: nextRunAt,
        updated_at: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  async updateStatus(jobId: string, status: JobStatus) {
    await db
      .update(jobs)
      .set({ status, updated_at: new Date() })
      .where(eq(jobs.id, jobId));
  }

  async getJobsByPipelineId(pipelineId: string) {
    const records = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        payload: jobs.payload,
        pipelineName: pipelines.name,
        createdAt: jobs.created_at,
      })
      .from(jobs)
      .innerJoin(pipelines, eq(jobs.pipline_id, pipelines.id))
      .where(eq(jobs.pipline_id, pipelineId))
      .orderBy(desc(jobs.created_at));
    return records;
  }
}

export const jobRepository = new JobRepository();
