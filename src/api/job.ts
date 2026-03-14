import type { Request, Response } from "express";

import { getBearerToken, validateAccessToken } from "../auth.js";
import { addJob } from "../db/queries/jobs.js";
import type { Job } from "../types/job.types.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function addJobHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { name, description } = req.body as Job;

  if (!isValidString(name) || !isValidString(description)) {
    res.status(400).json({ error: "name and description are required" });
    return;
  }

  let userId: string;
  try {
    const token = getBearerToken(req);
    userId = validateAccessToken(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    res.status(401).json({ error: message });
    return;
  }

  try {
    const job = await addJob({
      name: name.trim(),
      description: description.trim(),
      user_id: userId,
    });

    res.status(201).json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add job";
    res.status(500).json({ error: message });
  }
}
