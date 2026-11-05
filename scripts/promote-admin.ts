/**
 * Give an existing user the admin role.
 *   pnpm admin:promote you@example.com
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { user } from "../src/db/schema";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: pnpm admin:promote <email>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env first.");
  process.exit(1);
}

async function main(email: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const updated = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, email))
    .returning({ id: user.id });
  await pool.end();

  if (updated.length === 0) {
    console.error(`No user with email ${email}. Sign up first, then run this again.`);
    process.exit(1);
  }
  console.log(`✓ ${email} is now an admin.`);
}

void main(email);
