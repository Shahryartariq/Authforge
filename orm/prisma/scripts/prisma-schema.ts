/**
 * Runs after the Better Auth CLI writes prisma/schema.prisma (`pnpm auth:schema`).
 * Postgres stores `pg_catalog.gen_random_uuid()` as `gen_random_uuid()`, so the
 * CLI's spelling makes Prisma see a change that never goes away. Use Postgres's.
 */
import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
const schema = readFileSync(path, "utf8");
writeFileSync(path, schema.replaceAll("pg_catalog.gen_random_uuid()", "gen_random_uuid()"));
