import express from "express";
import cors from "cors";

import { chat } from "./api/agent.js";
import { login, logout, refresh } from "./api/auth.js";
import { addJobHandler } from "./api/job.js";
import { signup } from "./api/users.js";
import { config } from "./config.js";
import {
  middlewareErrorHandler,
  middlewareErrorLogger,
} from "./api/middleware.js";

const app = express();
const port = config.api.port;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/chat", (req, res, next) => {
  Promise.resolve(chat(req, res)).catch(next);
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

app.post("/jobs", (req, res, next) => {
  Promise.resolve(addJobHandler(req, res)).catch(next);
});

app.use(middlewareErrorLogger);
app.use(middlewareErrorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
