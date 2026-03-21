import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";

import { addPipelineHandler } from "../api/pipeline.js";
const authServiceMocks = vi.hoisted(() => ({
  authService: {
    verifyAccessToken: vi.fn(),
  },
}));

const pipelineServiceMocks = vi.hoisted(() => ({
  pipelineService: {
    createPipeline: vi.fn(),
  },
}));

const authMocks = vi.hoisted(() => ({
  getBearerToken: vi.fn(),
}));

const jsonMocks = vi.hoisted(() => ({
  respondWithJSON: vi.fn(),
}));

vi.mock("../auth.js", () => authMocks);
vi.mock("../services/authService.js", () => authServiceMocks);
vi.mock("../services/pipelineService.js", () => pipelineServiceMocks);
vi.mock("../api/json.js", () => jsonMocks);

describe("addPiplineHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pipelineServiceMocks.pipelineService.createPipeline.mockResolvedValue({
      pipeline: {
        id: "pipe-1",
        name: "Marketing Alerts",
        description: "Notify leads",
        webhook_id: "webhook123",
        user_id: "user-1",
      },
      webhookUrl: "http://localhost:8080/autolinks/webhook123",
    });
  });

  it("creates a pipeline with subscribers and responds with JSON", async () => {
    const req = {
      body: {
        name: "  Marketing Alerts  ",
        description: "  Notify leads  ",
        subscribers: [
          {
            type: "http request",
            config: {
              url: "https://example.com/hook",
              method: "POST",
              headers: { Authorization: "Bearer token" },
            },
          },
        ],
      },
    } as Request;
    const res = {} as Response;

    authMocks.getBearerToken.mockReturnValue("Bearer abc");
    authServiceMocks.authService.verifyAccessToken.mockReturnValue("user-1");

    await addPipelineHandler(req, res);

    expect(authMocks.getBearerToken).toHaveBeenCalledWith(req);
    expect(authServiceMocks.authService.verifyAccessToken).toHaveBeenCalledWith(
      "Bearer abc",
    );
    expect(pipelineServiceMocks.pipelineService.createPipeline).toHaveBeenCalledWith(
      "user-1",
      req.body,
    );
    expect(jsonMocks.respondWithJSON).toHaveBeenCalledWith(
      res,
      201,
      "http://localhost:8080/autolinks/webhook123",
    );
  });
});
