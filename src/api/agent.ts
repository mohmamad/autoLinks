import { Request, Response } from "express";
import {
  loadSkills,
  saveSkills,
  runWithSkills,
  Skill,
} from "../agent/skills.js";

export async function getSkills(_req: Request, res: Response): Promise<void> {
  const config = loadSkills();
  res.json(config);
}

export async function createSkill(
  req: Request,
  res: Response
): Promise<void> {
  const { name, description, when_to_use, rules, output_format } = req.body as {
    name?: string;
    description?: string;
    when_to_use?: string;
    rules?: string[];
    output_format?: any;
  };

  if (!name || !description || !when_to_use || !rules || !output_format) {
    res.status(400).json({
      error:
        "Missing required fields: name, description, when_to_use, rules, output_format",
    });
    return;
  }

  const config = loadSkills();
  const newSkill: Skill = {
    name,
    description,
    when_to_use,
    rules,
    output_format,
  };
  config.skills.push(newSkill);
  saveSkills(config);

  res.status(201).json({ success: true, skill: newSkill });
}

export async function deleteSkill(
  req: Request,
  res: Response
): Promise<void> {
  const { name } = req.params;
  const config = loadSkills();
  const initialLength = config.skills.length;
  config.skills = config.skills.filter((s: Skill) => s.name !== name);

  if (config.skills.length === initialLength) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  saveSkills(config);
  res.json({ success: true });
}

export async function chat(req: Request, res: Response): Promise<void> {
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
}
