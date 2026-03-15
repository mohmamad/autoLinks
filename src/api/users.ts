import type { Request, Response } from "express";

import {
  generateRefreshToken,
  hashPassword,
  makeAccessToken,
} from "../auth.js";
import { addRefreshToken } from "../db/queries/refreshTokens.js";
import {
  createUser,
  getUserByEmail,
  toPublicUser,
} from "../db/queries/users.js";
import { BadRequestError, ConflictError } from "./errors.js";
import type { signupRequest } from "../types/user.types.js";
import { respondWithJSON } from "./json.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function signup(req: Request, res: Response): Promise<void> {
  const signupRequest: signupRequest = req.body ?? {};

  if (
    !isValidString(signupRequest.username) ||
    !isValidString(signupRequest.email) ||
    !isValidString(signupRequest.password)
  ) {
    throw new BadRequestError("username, email and password are required");
  }

  const normalizedEmail = signupRequest.email.trim().toLowerCase();
  const normalizedUsername = signupRequest.username.trim();
  const sanitizedPassword = signupRequest.password.trim();

  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ConflictError("Email already in use");
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

  respondWithJSON(res, 201, {
    user: toPublicUser(user),
    token,
    refreshToken,
  });
}
