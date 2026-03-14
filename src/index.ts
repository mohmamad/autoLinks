import express from "express";
import cors from "cors";

import { chat } from "./api/agent.js";
import { login, logout, refresh } from "./api/auth.js";
import { addJobHandler } from "./api/job.js";
import { signup } from "./api/users.js";
import { config } from "./config.js";

const app = express();
const port = config.api.port;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/chat", chat);
app.post("/users/signup", signup);
app.post("/users/login", login);
app.post("/users/refresh", refresh);
app.post("/users/logout", logout);
app.post("/jobs", addJobHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
