import type { Request, Response } from "express";

import { getBearerToken } from "../auth.js";
import type { LoginRequest } from "../types/user.types.js";
import { respondWithJSON } from "./json.js";
import { authService } from "../services/authService.js";

export async function login(req: Request, res: Response): Promise<void> {
  const loginRequest: LoginRequest = req.body ?? {};
  const result = await authService.login(loginRequest);
  respondWithJSON(res, 200, result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const bearerToken = getBearerToken(req);
  const result = await authService.refreshAccessToken(bearerToken);
  respondWithJSON(res, 200, result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const bearerToken = getBearerToken(req);
  await authService.logout(bearerToken);
  respondWithJSON(res, 200, {});
}
