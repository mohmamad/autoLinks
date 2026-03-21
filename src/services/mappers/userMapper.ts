import { users } from "../../db/schema.js";

export type UserRecord = typeof users.$inferSelect;

export const toPublicUser = (user: UserRecord) => ({
  id: user.id,
  username: user.username,
  email: user.email,
});
