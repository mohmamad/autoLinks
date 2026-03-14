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

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};

  if (!isValidString(email) || !isValidString(password)) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const sanitizedPassword = password.trim();

  try {
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatches = await verifyPassword(sanitizedPassword, user.password);
    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = makeAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await addRefreshToken(user.id, refreshToken);

    res.json({ user: toPublicUser(user), token, refreshToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(500).json({ error: message });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  let bearerToken: string;
  try {
    bearerToken = getBearerToken(req);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing refresh token";
    res.status(400).json({ error: message });
    return;
  }

  const refreshTokenRecord = await getRefreshTokenByValue(bearerToken);

  if (!refreshTokenRecord) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  if (refreshTokenRecord.revoked_at) {
    res.status(401).json({ error: "Refresh token revoked" });
    return;
  }

  if (refreshTokenRecord.expires_at <= new Date()) {
    res.status(401).json({ error: "Refresh token expired" });
    return;
  }

  const token = makeAccessToken(refreshTokenRecord.user_id);
  res.json({ token });
}

export async function logout(req: Request, res: Response): Promise<void> {
  let bearerToken: string;
  try {
    bearerToken = getBearerToken(req);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing refresh token";
    res.status(400).json({ error: message });
    return;
  }

  await revokeRefreshToken(bearerToken);
  res.status(204).send();
}
