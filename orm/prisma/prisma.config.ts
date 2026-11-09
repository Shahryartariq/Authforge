import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` runs on install, before .env may exist, so a missing URL is allowed here.
  // Migration commands still need DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
