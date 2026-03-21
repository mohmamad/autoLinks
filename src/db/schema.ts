import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  pgEnum,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "done",
  "failed",
  "running",
]);

export const methodEnum = pgEnum("method", ["GET", "POST", "PUT", "DELETE"]);

export const subscriperTypeEnum = pgEnum("subscriper_type", [
  "slack",
  "email",
  "http request",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
});

export const pipelines = pgTable("pipelines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  webhook_id: text("webhook_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const subscripers = pgTable("subscripers", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipeline_id: uuid("pipeline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
  type: subscriperTypeEnum("type").notNull(),
  config: jsonb("config").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: jobStatusEnum("status").notNull().default("pending"),
  payload: text("payload"),
  retry_count: integer("retry_count").notNull().default(0),
  max_retries: integer("max_retries").notNull().default(3),
  next_run_at: timestamp("next_run_at").notNull().defaultNow(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  deleted_at: timestamp("deleted_at"),
  pipline_id: uuid("pipline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
});

export const refreshTokens = pgTable("refresh_tokens", {
  token: varchar("token", { length: 512 }).primaryKey().notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
  revoked_at: timestamp("revoked_at"),
});
