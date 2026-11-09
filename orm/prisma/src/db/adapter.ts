import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./index";

/** The Better Auth database adapter. auth.ts uses this, so it never imports an ORM directly. */
export const authAdapter = prismaAdapter(db, { provider: "postgresql" });
