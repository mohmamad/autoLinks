import { pgTable, serial, varchar, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
});

export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  incomingWebhook: text("incoming_webhook").notNull(),
  outgoingWebhook: text("outgoing_webhook").notNull(),
  userId: integer("user_id").references(() => users.id),
});
