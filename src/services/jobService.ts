import { jobs } from "../db/schema.js";
import { jobRepository, JOB_STATUS } from "../repositories/jobRepository.js";
import { pipelineRepository } from "../repositories/pipelineRepository.js";
import { NotFoundError } from "../api/errors.js";

export class JobService {
  constructor(
    private jobs = jobRepository,
    private pipelines = pipelineRepository,
  ) {}

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

  async listPipelineJobsForUser(userId: string, pipelineId: string) {
    const pipeline = await this.pipelines.getPipelineById(pipelineId);
    if (!pipeline || pipeline.user_id !== userId) {
      throw new NotFoundError("Pipeline not found");
    }

    const jobs = await this.jobs.getJobsByPipelineId(pipelineId);
    return jobs.map((job) => ({
      id: job.id,
      status: job.status,
      payload: job.payload,
      pipelineName: job.pipelineName,
      createdAt: job.createdAt,
    }));
  }
}

export const jobService = new JobService();
