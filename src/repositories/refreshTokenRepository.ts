import { eq } from "drizzle-orm";

import { config } from "../config.js";
import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";

export class RefreshTokenRepository {
  async create(userId: string, token: string) {
    await db.insert(refreshTokens).values({
      token,
      user_id: userId,
      expires_at: new Date(Date.now() + config.jwt.refreshTokenDurationMs),
    });
  }

  async findByToken(token: string) {
    const [record] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);
    return record ?? null;
  }

  async revoke(token: string) {
    await db
      .update(refreshTokens)
      .set({ revoked_at: new Date() })
      .where(eq(refreshTokens.token, token));
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
