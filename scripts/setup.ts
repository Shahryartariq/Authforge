/**
 * First-run setup: creates .env from .env.example with a fresh secret.
 *   pnpm env:setup
 */
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log("• .env already exists, leaving it alone.");
} else {
  copyFileSync(".env.example", ".env");
  const secret = randomBytes(32).toString("base64");
  const env = readFileSync(".env", "utf8").replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${secret}`);
  writeFileSync(".env", env);
  console.log("✓ Created .env with a new BETTER_AUTH_SECRET.");
}

console.log(`
Next steps:
  1. Set DATABASE_URL in .env (a free Neon database works: https://neon.tech)
  2. Put your email in ADMIN_EMAILS to become an admin when you sign up
  3. pnpm db:migrate
  4. pnpm dev  →  http://localhost:3000

Optional: add RESEND_API_KEY for real emails (otherwise they print to this terminal),
and Google / GitHub client IDs for social sign-in.
`);
