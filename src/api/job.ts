import type { Request, Response } from "express";

import { getBearerToken, validateAccessToken } from "../auth.js";
import { addJob } from "../db/queries/jobs.js";
import { BadRequestError } from "./errors.js";
import type { JobRequest } from "../types/job.types.js";
import { respondWithJSON } from "./json.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function addJobHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const jobrequest: JobRequest = req.body as JobRequest;

  if (
    !isValidString(jobrequest.name) ||
    !isValidString(jobrequest.description)
  ) {
    throw new BadRequestError("name and description are required");
  }

  const token = getBearerToken(req);
  const userId = validateAccessToken(token);

  const job = await addJob({
    name: jobrequest.name.trim(),
    description: jobrequest.description.trim(),
    user_id: userId,
  });

  respondWithJSON(res, 201, job);
}
