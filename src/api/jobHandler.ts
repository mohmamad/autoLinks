import { Request, Response } from "express";
import { Job } from "src/types/job.types";

export async function jobHandler(req: Request, res: Response): Promise<void> {
  const job: Job = req.body;
  res.json({ message: "Hello from jobHandler" });
}
