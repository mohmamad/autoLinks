import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

import { config } from "../config.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.db.url,
});

export const db = drizzle(pool);
