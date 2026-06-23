import { Pool } from "pg";
import { config } from "./config.js";

export const pool = new Pool({
  connectionString: config.databaseUrl.url,
  ssl: { rejectUnauthorized: false },
});
