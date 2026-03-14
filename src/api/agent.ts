import { Request, Response } from "express";
import { runWithSkills } from "../agent/skills.js";
import { ActionPlan } from "../types/agent.types.js";
import { validateActionPlan } from "../agent/validator.js";
export async function chat(req: Request, res: Response): Promise<void> {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "Missing required field: message" });
    return;
  }

  try {
    const result = await runWithSkills(message);
    const actionPlan: ActionPlan = JSON.parse(result);
    if (validateActionPlan(actionPlan)) {
      res.json(actionPlan);
    } else {
      res.status(500).json({ error: "Failed to get response" });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get response";
    console.error("Agent error", error);
    res.status(500).json({ error: message });
  }
}
