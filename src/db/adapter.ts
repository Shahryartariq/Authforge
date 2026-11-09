import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./index";
import * as schema from "./schema";

/** The Better Auth database adapter. auth.ts uses this, so it never imports an ORM directly. */
export const authAdapter = drizzleAdapter(db, { provider: "pg", schema });
