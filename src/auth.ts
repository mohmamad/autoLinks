import * as argon2 from "argon2";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";

import { BadRequestError, UnauthorizedError } from "./api/errors.js";
import { config } from "./config.js";

type TokenPayload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function makeAccessToken(userId: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    iss: config.jwt.issuer,
    sub: userId,
    iat,
    exp: iat + config.jwt.accessTokenDurationSeconds,
  };

  return jwt.sign(payload, config.jwt.secret, { algorithm: "HS256" });
}

export function validateAccessToken(token: string): string {
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid token");
  }

  if (decoded.iss !== config.jwt.issuer) {
    throw new UnauthorizedError("Invalid token issuer");
  }

  if (!decoded.sub) {
    throw new UnauthorizedError("Token missing subject");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const header = req.get("Authorization");
  if (!header) {
    throw new BadRequestError("Missing Authorization header");
  }

  return extractBearerToken(header);
}

export function extractBearerToken(header: string): string {
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    throw new BadRequestError("Malformed authorization header");
  }

  return token;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
