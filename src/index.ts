import express from "express";
import cors from "cors";
import { Worker } from "node:worker_threads";

import { getDiagram } from "./api/agent.js";
import { login, logout, refresh } from "./api/auth.js";
import { addPipelineHandler, getPipelinesHandler } from "./api/pipeline.js";
import { signup } from "./api/users.js";
import { config } from "./config.js";
import {
  middlewareErrorHandler,
  middlewareErrorLogger,
} from "./api/middleware.js";
import { autolinkHandler } from "./api/autolinks.js";

const app = express();
const port = config.api.port;
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 1);
const workerEntry = new URL("./worker/thread-entry.js", import.meta.url);

type WorkerSlot = {
  worker: Worker;
  busy: boolean;
};

const workerPool: WorkerSlot[] = [];
let workerPoolInitialized = false;
let shuttingDown = false;
let dispatchInProgress = false;

function markDispatchCompleteIfIdle() {
  if (dispatchInProgress && workerPool.every((slot) => !slot.busy)) {
    dispatchInProgress = false;
  }
}

function createWorkerSlot(index: number): WorkerSlot {
  const worker = new Worker(workerEntry);
  const slot: WorkerSlot = { worker, busy: false };

  worker.on("message", (message) => {
    slot.busy = false;
    if (message?.type === "error") {
      console.error("Worker thread job failed", message.error);
    }
    markDispatchCompleteIfIdle();
  });

  worker.on("error", (error) => {
    slot.busy = false;
    console.error("Worker thread crashed", error);
    markDispatchCompleteIfIdle();
  });

  worker.on("exit", (code) => {
    slot.busy = false;
    if (shuttingDown) {
      return;
    }
    if (code !== 0) {
      console.warn(`Worker thread exited with code ${code}, restarting.`);
    }
    workerPool[index] = createWorkerSlot(index);
  });

  return slot;
}

function ensureWorkerPool() {
  if (workerPoolInitialized) {
    return;
  }
  for (let i = 0; i < WORKER_CONCURRENCY; i += 1) {
    workerPool[i] = createWorkerSlot(i);
  }
  workerPoolInitialized = true;
}

type DispatchResult = "started" | "already-running" | "no-workers";

function triggerWorkerRun(): DispatchResult {
  ensureWorkerPool();
  if (dispatchInProgress) {
    return "already-running";
  }

  let dispatched = false;
  for (const slot of workerPool) {
    if (!slot.busy) {
      slot.busy = true;
      slot.worker.postMessage({ type: "run" });
      dispatched = true;
    }
  }

  if (dispatched) {
    dispatchInProgress = true;
    return "started";
  }

  return "no-workers";
}

async function stopWorkerPool() {
  shuttingDown = true;
  await Promise.all(
    workerPool.map((slot) => slot.worker.terminate().catch(() => undefined)),
  );
  workerPool.length = 0;
  workerPoolInitialized = false;
  dispatchInProgress = false;
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/pipelines/diagram", (req, res, next) => {
  Promise.resolve(getDiagram(req, res)).catch(next);
});

app.post("/users/signup", (req, res, next) => {
  Promise.resolve(signup(req, res)).catch(next);
});

app.post("/users/login", (req, res, next) => {
  Promise.resolve(login(req, res)).catch(next);
});

app.post("/users/refresh", (req, res, next) => {
  Promise.resolve(refresh(req, res)).catch(next);
});

app.post("/users/logout", (req, res, next) => {
  Promise.resolve(logout(req, res)).catch(next);
});

app.post("/pipelines", (req, res, next) => {
  Promise.resolve(addPipelineHandler(req, res)).catch(next);
});

app.post("/autolinks/:webhookId", (req, res, next) => {
  Promise.resolve(autolinkHandler(req, res)).catch(next);
});

app.get("/pipelines", (req, res, next) => {
  Promise.resolve(getPipelinesHandler(req, res)).catch(next);
});

app.post("/workers/run", (_req, res) => {
  const result = triggerWorkerRun();
  if (result === "started") {
    res.status(202).json({ status: "started" });
    return;
  }

  if (result === "already-running") {
    res.status(202).json({ status: "running" });
    return;
  }

  res.status(200).json({ status: "idle" });
});

app.use(middlewareErrorLogger);
app.use(middlewareErrorHandler);

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

server.on("close", () => {
  void stopWorkerPool();
});
