import { eq } from "drizzle-orm";

import { db } from "../index.js";
import { users } from "../schema.js";

export type UserRecord = typeof users.$inferSelect;

export const toPublicUser = (user: UserRecord) => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function createUser(input: typeof users.$inferInsert) {
  const [user] = await db.insert(users).values(input).returning();
  return user;
}
