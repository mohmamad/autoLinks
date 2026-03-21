import { describe, it, expect, beforeEach, vi } from "vitest";

import { jobService } from "../services/jobService.js";

const jobRepositoryMocks = vi.hoisted(() => ({
  jobRepository: {
    create: vi.fn(),
    getNextRunnableJob: vi.fn(),
    updateStatus: vi.fn(),
    scheduleRetry: vi.fn(),
  },
}));

vi.mock("../repositories/jobRepository.js", () => jobRepositoryMocks);

describe("jobService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues a job via the repository", async () => {
    jobRepositoryMocks.jobRepository.create.mockResolvedValueOnce({
      id: "job-1",
      pipline_id: "pipe-1",
    });

    const input = { pipline_id: "pipe-1" } as any;
    const result = await jobService.enqueueJob(input);

    expect(jobRepositoryMocks.jobRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual({ id: "job-1", pipline_id: "pipe-1" });
  });
});
