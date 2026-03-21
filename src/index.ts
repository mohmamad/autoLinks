import express from "express";
import cors from "cors";
import { Worker } from "node:worker_threads";

import { getDiagram } from "./api/agent.js";
import { login, logout, refresh } from "./api/auth.js";
import { addPipelineHandler } from "./api/pipeline.js";
import { signup } from "./api/users.js";
import { config } from "./config.js";
import {
  middlewareErrorHandler,
  middlewareErrorLogger,
} from "./api/middleware.js";
import { autolinkHandler } from "./api/autolinks.js";
import { sendSlackMessage } from "./worker/subscripers.js";

const app = express();
const port = config.api.port;
const WORKER_POLL_INTERVAL_MS = Number(
  process.env.WORKER_POLL_INTERVAL_MS ?? 2000,
);
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 1);
const workerEntry = new URL("./worker/thread-entry.js", import.meta.url);

type WorkerSlot = {
  worker: Worker;
  busy: boolean;
};

const workerPool: WorkerSlot[] = [];
let workerInterval: ReturnType<typeof setInterval> | null = null;
let shuttingDown = false;

function createWorkerSlot(index: number): WorkerSlot {
  const worker = new Worker(workerEntry);
  const slot: WorkerSlot = { worker, busy: false };

  worker.on("message", (message) => {
    slot.busy = false;
    if (message?.type === "error") {
      console.error("Worker thread job failed", message.error);
    }
  });

  worker.on("error", (error) => {
    slot.busy = false;
    console.error("Worker thread crashed", error);
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

function dispatchWork() {
  for (const slot of workerPool) {
    if (!slot.busy) {
      slot.busy = true;
      slot.worker.postMessage({ type: "run" });
    }
  }
}

function startWorkerPool() {
  for (let i = 0; i < WORKER_CONCURRENCY; i += 1) {
    workerPool[i] = createWorkerSlot(i);
  }
  dispatchWork();
  workerInterval = setInterval(dispatchWork, WORKER_POLL_INTERVAL_MS);
}

async function stopWorkerPool() {
  shuttingDown = true;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  await Promise.all(
    workerPool.map((slot) => slot.worker.terminate().catch(() => undefined)),
  );
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

app.use(middlewareErrorLogger);
app.use(middlewareErrorHandler);

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  startWorkerPool();
});

server.on("close", () => {
  void stopWorkerPool();
});
