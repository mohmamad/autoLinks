import { Request, Response } from "express";

import { runWithSkills } from "../agent/skills.js";
import { validateActionPlan } from "../agent/validator.js";
import { BadRequestError } from "./errors.js";
import { ActionPlan } from "../types/agent.types.js";
export async function chat(req: Request, res: Response): Promise<void> {
  const { message } = req.body;

  if (!message) {
    throw new BadRequestError("Missing required field: message");
  }

  try {
    const result = await runWithSkills(message);
    const actionPlan: ActionPlan = JSON.parse(result);
    if (validateActionPlan(actionPlan)) {
      res.json(actionPlan);
    } else {
      throw new Error("Failed to get response");
    }
  } catch (error) {
    console.error("Agent error", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get response");
  }
}
