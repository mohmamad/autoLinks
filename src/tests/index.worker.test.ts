import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const executeJobMock = vi.hoisted(() => vi.fn());

vi.mock("../worker/worker.js", () => ({
  executeJob: executeJobMock,
}));

const workerThreadMocks = vi.hoisted(() => {
  type Listener = (payload: any) => void;

  class SimpleEmitter {
    #listeners = new Map<string, Listener[]>();

    on(event: string, handler: Listener) {
      const existing = this.#listeners.get(event) ?? [];
      existing.push(handler);
      this.#listeners.set(event, existing);
      return this;
    }

    emit(event: string, payload: any) {
      const listeners = this.#listeners.get(event) ?? [];
      for (const listener of listeners) {
        listener(payload);
      }
    }
  }

  class MockWorker extends SimpleEmitter {
    postMessage = vi.fn((message: { type: string }) => {
      if (message?.type === "run") {
        Promise.resolve(executeJobMock())
          .then(() => this.emit("message", { type: "done" }))
          .catch((error) => this.emit("message", { type: "error", error }));
      }
    });

    terminate = vi.fn(async () => undefined);
  }

  return { MockWorker };
});

vi.mock("node:worker_threads", () => ({
  Worker: workerThreadMocks.MockWorker,
}));

const expressFactory = vi.hoisted(() => {
  const expressFn = vi.fn(() => ({
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    listen: vi.fn((_port: number, callback?: () => void) => {
      callback?.();
      return {
        close: vi.fn(),
        on: vi.fn(),
      } as unknown as import("http").Server;
    }),
  }));
  (expressFn as any).json = vi.fn(
    () => (_req: any, _res: any, next: () => void) => next(),
  );
  return expressFn as any;
});

vi.mock("express", () => ({
  default: expressFactory,
}));

vi.mock("cors", () => ({
  default: vi.fn(() => (_req: any, _res: any, next: () => void) => next()),
}));

vi.mock("../api/agent.js", () => ({ getDiagram: vi.fn() }));
vi.mock("../api/auth.js", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("../api/pipeline.js", () => ({ addPiplineHandler: vi.fn() }));
vi.mock("../api/users.js", () => ({ signup: vi.fn() }));
vi.mock("../api/middleware.js", () => ({
  middlewareErrorHandler: vi.fn(),
  middlewareErrorLogger: vi.fn(),
}));
vi.mock("../api/autolinks.js", () => ({ autolinkHandler: vi.fn() }));
vi.mock("../config.js", () => ({
  config: {
    api: { port: 8080 },
    db: { url: "postgres://test" },
    jwt: {
      secret: "secret",
      issuer: "issuer",
      accessTokenDurationSeconds: 3600,
      refreshTokenDurationMs: 1000,
    },
  },
}));

describe("server worker concurrency", () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    executeJobMock.mockReset();
    setIntervalSpy = vi
      .spyOn(globalThis, "setInterval")
      .mockImplementation(() => 0 as unknown as ReturnType<typeof setInterval>);
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    delete process.env.WORKER_CONCURRENCY;
    delete process.env.WORKER_POLL_INTERVAL_MS;
  });

  it("launches as many worker ticks as configured", async () => {
    process.env.WORKER_CONCURRENCY = "5";
    process.env.WORKER_POLL_INTERVAL_MS = "60000";
    executeJobMock.mockResolvedValue(undefined);

    await import("../index.js");

    expect(executeJobMock).toHaveBeenCalledTimes(5);
  });
});
