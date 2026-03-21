import { describe, it, expect, beforeEach, vi } from "vitest";

import { PipelineService } from "../services/pipelineService.js";
import type { PiplineRequest } from "../types/pipline.types.js";

const assertUrlAllowedMock = vi.hoisted(() => vi.fn());

vi.mock("../services/httpClient.js", () => ({
  assertUrlAllowed: assertUrlAllowedMock,
}));

describe("PipelineService", () => {
  const pipelineRepo = {
    create: vi.fn(),
    findByWebhookId: vi.fn(),
    findById: vi.fn(),
  };
  const subscriberRepo = {
    create: vi.fn(),
    listByPipelineId: vi.fn(),
  };
  let service: PipelineService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PipelineService(pipelineRepo as any, subscriberRepo as any);
    pipelineRepo.create.mockResolvedValue({
      id: "pipeline-1",
      name: "Test",
      description: "Desc",
      webhook_id: "hook",
      user_id: "user-1",
    });
    assertUrlAllowedMock.mockResolvedValue(undefined);
  });

  it("validates HTTP subscriber URLs before persisting", async () => {
    const request: PiplineRequest = {
      name: "Alerts",
      description: "Send notifications",
      subscribers: [
        {
          type: "http request",
          config: {
            url: "https://example.com/hook",
            method: "POST",
            headers: { Authorization: "Bearer" },
          },
        },
      ],
    };

    await service.createPipeline("user-1", request);

    expect(assertUrlAllowedMock).toHaveBeenCalledWith("https://example.com/hook");
    expect(subscriberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "http request" }),
    );
  });

  it("throws when the URL validator rejects", async () => {
    assertUrlAllowedMock.mockRejectedValueOnce(new Error("Blocked host"));
    const request: PiplineRequest = {
      name: "Alerts",
      description: "Send notifications",
      subscribers: [
        {
          type: "http request",
          config: {
            url: "http://localhost",
            method: "POST",
          },
        },
      ],
    };

    await expect(service.createPipeline("user-1", request)).rejects.toThrow(
      "Blocked host",
    );
    expect(subscriberRepo.create).not.toHaveBeenCalled();
  });
});
