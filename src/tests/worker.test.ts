import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import * as worker from "../worker/worker.js";
import { hitUrl, sendEmail, sendSlackMessage } from "../worker/subscripers.js";
import type { ActionPlan } from "../types/agent.types.js";

const emailServiceMocks = vi.hoisted(() => ({
  sendEmailMessage: vi.fn(),
}));

vi.mock("../services/emailService.js", () => emailServiceMocks);

const ORIGINAL_ENV = { ...process.env };

const jobServiceMocks = vi.hoisted(() => ({
  jobService: {
    getNextJobWithPipeline: vi.fn(),
    markJobDone: vi.fn(),
    markJobFailed: vi.fn(),
    scheduleRetry: vi.fn(),
  },
}));

const skillMocks = vi.hoisted(() => ({
  runWithSkills: vi.fn(),
}));

const validatorMocks = vi.hoisted(() => ({
  validateActionPlan: vi.fn(),
}));

const pipelineServiceMocks = vi.hoisted(() => ({
  pipelineService: {
    listSubscribers: vi.fn(),
  },
}));

vi.mock("../services/jobService.js", () => jobServiceMocks);
vi.mock("../services/pipelineService.js", () => pipelineServiceMocks);
vi.mock("../agent/skills.js", () => skillMocks);
vi.mock("../agent/validator.js", () => validatorMocks);

describe("executeJob", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const plan: ActionPlan = {
      diagram: "graph TD",
      result: {
        body: { value: 1 },
      },
    };
    skillMocks.runWithSkills.mockResolvedValue(JSON.stringify(plan));
    validatorMocks.validateActionPlan.mockReturnValue(true);
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks jobs as DONE when hitting URLs succeeds", async () => {
    const jobRecord = {
      jobs: {
        id: "job-1",
        payload: '{"a":1}',
        retry_count: 0,
        max_retries: 3,
      },
      pipelines: { id: "pipeline-1", description: "Send alerts" },
    } as any;

    jobServiceMocks.jobService.getNextJobWithPipeline.mockResolvedValue(jobRecord);
    pipelineServiceMocks.pipelineService.listSubscribers.mockResolvedValue([
      {
        type: "http request",
        config: {
          url: "https://example.com/hook",
          method: "POST",
          headers: { Authorization: "Bearer" },
        },
      },
    ]);
    await worker.executeJob();

    expect(jobServiceMocks.jobService.markJobDone).toHaveBeenCalledWith(
      "job-1",
    );
    expect(jobServiceMocks.jobService.scheduleRetry).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/hook", {
      method: "POST",
      headers: { Authorization: "Bearer" },
      body: JSON.stringify({ value: 1 }),
    });
  });

  it("marks jobs as FAILED when URL execution fails", async () => {
    const jobRecord = {
      jobs: {
        id: "job-2",
        payload: null,
        retry_count: 3,
        max_retries: 3,
      },
      pipelines: { id: "pipeline-2", description: "Process" },
    } as any;

    jobServiceMocks.jobService.getNextJobWithPipeline.mockResolvedValue(jobRecord);
    pipelineServiceMocks.pipelineService.listSubscribers.mockResolvedValue([
      {
        type: "http request",
        config: {
          url: "https://example.com",
          method: "GET",
          headers: null,
        },
      },
    ]);
    fetchMock.mockResolvedValue({ ok: false });

    await worker.executeJob();

    expect(jobServiceMocks.jobService.markJobFailed).toHaveBeenCalledWith(
      "job-2",
    );
    expect(jobServiceMocks.jobService.scheduleRetry).not.toHaveBeenCalled();
  });

  it("reschedules jobs when retries remain", async () => {
    const jobRecord = {
      jobs: {
        id: "job-3",
        payload: null,
        retry_count: 0,
        max_retries: 2,
      },
      pipelines: { id: "pipeline-3", description: "Notify" },
    } as any;

    jobServiceMocks.jobService.getNextJobWithPipeline.mockResolvedValue(jobRecord);
    pipelineServiceMocks.pipelineService.listSubscribers.mockResolvedValue([
      {
        type: "http request",
        config: {
          url: "https://example.com",
          method: "POST",
          headers: null,
        },
      },
    ]);
    fetchMock.mockResolvedValue({ ok: false });

    await worker.executeJob();

    expect(jobServiceMocks.jobService.scheduleRetry).toHaveBeenCalledWith(
      "job-3",
      1,
      expect.any(Date),
    );
    expect(jobServiceMocks.jobService.markJobDone).not.toHaveBeenCalled();
  });
});

describe("hitUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when every fetch call succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as any;

    const plan: ActionPlan = {
      diagram: "graph TD",
      result: {
        body: { value: 10 },
      },
    };

    const subscriber = {
      type: "http request" as const,
      config: {
        url: "https://example.com",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    };

    const success = await hitUrl(plan, subscriber);

    expect(fetchMock).toHaveBeenCalledWith("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: 10 }),
    });
    expect(success).toBe(true);
  });

  it("returns false when any fetch response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    globalThis.fetch = fetchMock as any;

    const plan: ActionPlan = {
      diagram: "graph TD",
      result: {
        body: {},
      },
    };

    const subscriber = {
      type: "http request" as const,
      config: {
        url: "https://example.com/fail",
        method: "GET",
        headers: {},
      },
    };

    const success = await hitUrl(plan, subscriber);

    expect(success).toBe(false);
  });
});

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      BREVO_API_KEY: "brevo-key",
      EMAIL_FROM: "alerts@example.com",
    };
    emailServiceMocks.sendEmailMessage.mockResolvedValue({ rejected: [] });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("sends the action plan payload via Brevo", async () => {
    const plan: ActionPlan = {
      diagram: "graph TD",
      result: {
        body: { message: "Processing done", count: 2 },
      },
    };

    const subscriber = {
      type: "email" as const,
      config: {
        to: "ops@example.com",
        subject: "Ops Alert",
        from: "alerts@example.com",
        category: "alerts",
      },
    };

    const success = await sendEmail(plan, subscriber);

    expect(success).toBe(true);
    const serializedPayload = JSON.stringify(plan.result.body, null, 2);
    expect(emailServiceMocks.sendEmailMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ops@example.com",
        subject: "Ops Alert",
        from: "alerts@example.com",
        text: serializedPayload,
        category: "alerts",
      }),
    );
    const mailOptions = emailServiceMocks.sendEmailMessage.mock.calls[0][0];
    expect(mailOptions.html).toContain("&quot;message&quot;");
    expect(mailOptions.html).toContain("&quot;count&quot;");
  });

  it("throws when no recipient is provided", async () => {
    const plan: ActionPlan = {
      diagram: "graph TD",
      result: {
        body: { value: 1 },
      },
    };

    const subscriber = {
      type: "email" as const,
      config: {} as any,
    };

    await expect(sendEmail(plan, subscriber as any)).rejects.toThrow(
      "Email subscriber must include a recipient",
    );
  });
});

describe("sendSlackMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts a JSON payload to the configured webhook", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as any;

    const plan: ActionPlan = {
      diagram: "graph TD",
      result: {
        body: { status: "ok", attempts: 2 },
      },
    };

    const subscriber = {
      type: "slack" as const,
      config: {
        webhookUrl: "https://hooks.slack.com/services/test",
      },
    };

    const success = await sendSlackMessage(plan, subscriber);

    expect(success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.text).toBe(
      `New pipeline result:\n${JSON.stringify(plan.result.body, null, 2)}`,
    );
  });
});

describe("getActionPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the diagram and body provided by the AI", async () => {
    const aiPlan: ActionPlan = {
      diagram: "graph TD\nA --> B",
      result: {
        body: { status: "ok", attempts: 2 },
      },
    };

    skillMocks.runWithSkills.mockResolvedValue(JSON.stringify(aiPlan));
    validatorMocks.validateActionPlan.mockReturnValue(true);

    const plan = await worker.getActionPlan(
      "Send notification",
      '{"message":"hello"}',
    );

    expect(plan.diagram).toBe(aiPlan.diagram);
    expect(plan.result.body).toEqual(aiPlan.result.body);
    expect(skillMocks.runWithSkills).toHaveBeenCalledWith(
      'Send notification data: [ {"message":"hello"} ]',
    );
  });
});
