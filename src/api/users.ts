import type { Request, Response } from "express";

import type { signupRequest } from "../types/user.types.js";
import { respondWithJSON } from "./json.js";
import { userService } from "../services/userService.js";

export async function signup(req: Request, res: Response): Promise<void> {
  const signupRequest: signupRequest = req.body ?? {};
  const result = await userService.register(signupRequest);
  respondWithJSON(res, 201, result);
}
