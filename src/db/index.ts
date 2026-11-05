import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  var __pgPool: Pool | undefined;
}

// Reuse one pool across hot reloads in development and warm serverless invocations.
const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 5 : 10,
  });

if (env.NODE_ENV !== "production") globalThis.__pgPool = pool;

export const db = drizzle(pool, { schema });
export type DB = typeof db;
