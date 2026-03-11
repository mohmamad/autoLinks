import express from "express";
import cors from "cors";
import { loadSkills, saveSkills, runWithSkills, Skill } from "./agent/skills.js";
import { runAgent } from "./agent/agent.js";

const app = express();
const port = process.env.PORT || 8010;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/skills", (_req, res) => {
  const config = loadSkills();
  res.json(config);
});

app.post("/skills", (req, res) => {
  const { name, description, when_to_use, rules, output_format } = req.body as {
    name?: string;
    description?: string;
    when_to_use?: string;
    rules?: string[];
    output_format?: any;
  };

  if (!name || !description || !when_to_use || !rules || !output_format) {
    res.status(400).json({ error: "Missing required fields: name, description, when_to_use, rules, output_format" });
    return;
  }

  const config = loadSkills();
  const newSkill: Skill = { name, description, when_to_use, rules, output_format };
  config.skills.push(newSkill);
  saveSkills(config);

  res.status(201).json({ success: true, skill: newSkill });
});

app.delete("/skills/:name", (req, res) => {
  const { name } = req.params;
  const config = loadSkills();
  const initialLength = config.skills.length;
  config.skills = config.skills.filter((s) => s.name !== name);

  if (config.skills.length === initialLength) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  saveSkills(config);
  res.json({ success: true });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    res.status(400).json({ error: "Missing required field: message" });
    return;
  }

  try {
    const reply = await runWithSkills(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: "Failed to get response" });
  }
});

app.post("/agent", async (req, res) => {
  const { goal } = req.body as { goal?: string };

  if (!goal) {
    res.status(400).json({ error: "Missing required field: goal" });
    return;
  }

  try {
    const result = await runAgent(goal);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to run agent" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
