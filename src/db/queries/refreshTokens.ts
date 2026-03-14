import { eq } from "drizzle-orm";

import { config } from "../../config.js";
import { db } from "../index.js";
import { refreshTokens } from "../schema.js";

export async function addRefreshToken(userId: string, token: string) {
  await db.insert(refreshTokens).values({
    token,
    user_id: userId,
    expires_at: new Date(Date.now() + config.jwt.refreshTokenDurationMs),
  });
}

export async function getRefreshTokenByValue(token: string) {
  const [refreshToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);
  return refreshToken ?? null;
}

export async function revokeRefreshToken(token: string) {
  await db
    .update(refreshTokens)
    .set({ revoked_at: new Date() })
    .where(eq(refreshTokens.token, token));
}
