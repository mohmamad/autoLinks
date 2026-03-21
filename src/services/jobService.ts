import { jobs } from "../db/schema.js";
import { jobRepository, JOB_STATUS } from "../repositories/jobRepository.js";

export class JobService {
  constructor(private jobs = jobRepository) {}

  async enqueueJob(input: typeof jobs.$inferInsert) {
    return this.jobs.create(input);
  }

  async getNextJobWithPipeline() {
    return this.jobs.getNextRunnableJob();
  }

  async markJobDone(jobId: string) {
    await this.jobs.updateStatus(jobId, JOB_STATUS.DONE);
  }

  async markJobFailed(jobId: string) {
    await this.jobs.updateStatus(jobId, JOB_STATUS.FAILED);
  }

  async scheduleRetry(jobId: string, retryCount: number, nextRunAt: Date) {
    await this.jobs.scheduleRetry(jobId, retryCount, nextRunAt);
  }
}

export const jobService = new JobService();
