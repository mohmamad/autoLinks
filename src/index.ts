import express from "express";
import cors from "cors";
import { getSkills, createSkill, deleteSkill, chat } from "./api/agent.js";

const app = express();
const port = process.env.PORT || 8010;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/skills", getSkills);

app.post("/skills", createSkill);

app.delete("/skills/:name", deleteSkill);

app.post("/chat", chat);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
