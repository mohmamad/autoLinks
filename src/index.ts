import express from "express";
import cors from "cors";

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
import { executeJob } from "./worker/worker.js";

const app = express();
const port = config.api.port;
async function runWorkerLoop() {
  let processed = 0;
  // Drain the queue synchronously so Scheduler calls wait until the queue is empty.
  while (true) {
    const handled = await executeJob();
    if (!handled) {
      return processed;
    }
    processed += 1;
  }
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

app.post("/workers/run", (_req, res, next) => {
  Promise.resolve(runWorkerLoop())
    .then((processed) => {
      const status = processed > 0 ? "processed" : "idle";
      res.status(200).json({ status, processed });
    })
    .catch(next);
});

app.use(middlewareErrorLogger);
app.use(middlewareErrorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
