import type { Request, Response } from "express";

import {
  generateRefreshToken,
  getBearerToken,
  makeAccessToken,
  verifyPassword,
} from "../auth.js";
import {
  addRefreshToken,
  getRefreshTokenByValue,
  revokeRefreshToken,
} from "../db/queries/refreshTokens.js";
import { getUserByEmail, toPublicUser } from "../db/queries/users.js";
import { BadRequestError, UnauthorizedError } from "./errors.js";
import type { LoginRequest } from "../types/user.types.js";
import { respondWithJSON } from "./json.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function login(req: Request, res: Response): Promise<void> {
  const loginRequest: LoginRequest = req.body ?? {};

  if (
    !isValidString(loginRequest.email) ||
    !isValidString(loginRequest.password)
  ) {
    throw new BadRequestError("email and password are required");
  }

  const normalizedEmail = loginRequest.email.trim().toLowerCase();
  const sanitizedPassword = loginRequest.password.trim();

  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const passwordMatches = await verifyPassword(
    sanitizedPassword,
    user.password,
  );
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = makeAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  await addRefreshToken(user.id, refreshToken);

  res.json({ user: toPublicUser(user), token, refreshToken });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const bearerToken = getBearerToken(req);

  const refreshTokenRecord = await getRefreshTokenByValue(bearerToken);

  if (!refreshTokenRecord) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (refreshTokenRecord.revoked_at) {
    throw new UnauthorizedError("Refresh token revoked");
  }

  if (refreshTokenRecord.expires_at <= new Date()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  const token = makeAccessToken(refreshTokenRecord.user_id);
  respondWithJSON(res, 200, { token });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const bearerToken = getBearerToken(req);

  await revokeRefreshToken(bearerToken);
  respondWithJSON(res, 200, {});
}
