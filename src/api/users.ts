import type { Request, Response } from "express";

import { generateRefreshToken, hashPassword, makeAccessToken } from "../auth.js";
import { addRefreshToken } from "../db/queries/refreshTokens.js";
import {
  createUser,
  getUserByEmail,
  toPublicUser,
} from "../db/queries/users.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function signup(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body ?? {};

  if (
    !isValidString(username) ||
    !isValidString(email) ||
    !isValidString(password)
  ) {
    res.status(400).json({ error: "username, email and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();
  const sanitizedPassword = password.trim();

  try {
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const hashedPassword = await hashPassword(sanitizedPassword);
    const user = await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = makeAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await addRefreshToken(user.id, refreshToken);

    res.status(201).json({
      user: toPublicUser(user),
      token,
      refreshToken,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    res.status(500).json({ error: message });
  }
}
