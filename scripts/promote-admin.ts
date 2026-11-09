/**
 * Give an existing user the admin role.
 *   pnpm admin:promote you@example.com
 */
import { setRoleByEmail } from "../src/db/queries";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: pnpm admin:promote <email>");
  process.exit(1);
}

setRoleByEmail(email, "admin").then(
  (found) => {
    if (!found) {
      console.error(`No user with email ${email}. Sign up first, then run this again.`);
      process.exit(1);
    }
    console.log(`✓ ${email} is now an admin.`);
    process.exit(0);
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
