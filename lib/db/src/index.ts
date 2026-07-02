import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// DATABASE_URL is optional — when absent (e.g. MySQL-only setups) the pool
// is created with an empty/invalid connection string so the module loads
// without crashing. Routes that query Postgres will fail at runtime and
// return empty results, but Java-backed routes continue to work normally.
const connectionString = process.env.DATABASE_URL ?? "postgres://localhost/placeholder_not_configured";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
