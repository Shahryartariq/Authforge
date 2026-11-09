import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "@/lib/env";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 5 : 10,
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development and warm serverless invocations.
export const db = globalThis.__prisma ?? createClient();

if (env.NODE_ENV !== "production") globalThis.__prisma = db;

export type DB = typeof db;
