import { describe, it, expect, beforeEach, vi } from "vitest";

const executeJobMock = vi.hoisted(() => vi.fn());

vi.mock("../worker/worker.js", () => ({
  executeJob: executeJobMock,
}));

describe("worker loop", () => {
  beforeEach(() => {
    vi.resetModules();
    executeJobMock.mockReset();
  });

  it("runs until no more jobs are returned", async () => {
    // simulate: 2 jobs processed, then empty queue
    executeJobMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const mod = await import("../index.js");

    const processed = await mod.runWorkerLoop();

    expect(executeJobMock).toHaveBeenCalledTimes(3); // includes final false
    expect(processed).toBe(2); // only successful jobs counted
  });
});
