/**
 * First-run setup:
 *   1. creates .env from .env.example with a fresh secret
 *   2. asks which ORM to use (Drizzle or Prisma) and removes the other one's files
 *
 *   pnpm env:setup                 asks
 *   pnpm env:setup --orm prisma    no questions (also: --orm drizzle)
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";

type Orm = "drizzle" | "prisma";

const PRISMA_VERSION = "7.10.1";

async function main() {
  createEnvFile();

  if (existsSync("orm")) {
    const orm = await chooseOrm();
    if (orm === "prisma") switchToPrisma();
    else keepDrizzle();
  } else {
    console.log("• ORM already chosen, nothing to switch.");
  }

  printNextSteps();
}

function createEnvFile() {
  if (existsSync(".env")) {
    console.log("• .env already exists, leaving it alone.");
    return;
  }
  copyFileSync(".env.example", ".env");
  const secret = randomBytes(32).toString("base64");
  const env = readFileSync(".env", "utf8").replace(
    /^BETTER_AUTH_SECRET=.*$/m,
    `BETTER_AUTH_SECRET=${secret}`,
  );
  writeFileSync(".env", env);
  console.log("✓ Created .env with a new BETTER_AUTH_SECRET.");
}

async function chooseOrm(): Promise<Orm> {
  const flag = process.argv.indexOf("--orm");
  if (flag !== -1) {
    const value = process.argv[flag + 1];
    if (value === "drizzle" || value === "prisma") return value;
    console.error('--orm must be "drizzle" or "prisma".');
    process.exit(1);
  }

  if (!process.stdin.isTTY) {
    console.log("• No terminal to ask in, keeping Drizzle. Run `pnpm env:setup --orm prisma` to switch.");
    return "drizzle";
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    "\nWhich ORM do you want?\n  1) Drizzle  (default: pure TypeScript, SQL-like queries)\n  2) Prisma   (schema file, generated client)\n> ",
  );
  rl.close();
  return /^\s*(2|p)/i.test(answer) ? "prisma" : "drizzle";
}

function keepDrizzle() {
  rmSync("orm", { recursive: true, force: true });
  tidyConfigs("drizzle");
  console.log("✓ Using Drizzle. Removed the Prisma files.");
}

function switchToPrisma() {
  // Copy the Prisma versions of src/db/*, the schema and the migration over the project.
  cpSync("orm/prisma", ".", { recursive: true });
  for (const path of ["orm", "drizzle", "drizzle.config.ts", "src/db/schema.ts"]) {
    rmSync(path, { recursive: true, force: true });
  }

  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  for (const name of ["drizzle-orm", "pg"]) delete pkg.dependencies[name];
  for (const name of ["drizzle-kit", "@types/pg"]) delete pkg.devDependencies[name];
  pkg.dependencies["@prisma/adapter-pg"] = PRISMA_VERSION;
  pkg.dependencies["@prisma/client"] = PRISMA_VERSION;
  pkg.devDependencies["prisma"] = PRISMA_VERSION;
  pkg.dependencies = sortKeys(pkg.dependencies);
  pkg.devDependencies = sortKeys(pkg.devDependencies);
  Object.assign(pkg.scripts, {
    postinstall: "prisma generate",
    "auth:schema": "auth generate --config src/lib/auth.ts --output prisma/schema.prisma --yes",
    "db:generate": "prisma migrate dev --create-only",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio",
  });
  writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);

  const gitignore = readFileSync(".gitignore", "utf8");
  if (!gitignore.includes("/src/generated/")) {
    writeFileSync(".gitignore", `${gitignore.trimEnd()}\n\n# prisma client\n/src/generated/\n`);
  }

  tidyConfigs("prisma");
  console.log("✓ Switched to Prisma. Installing packages…\n");

  const install = spawnSync("pnpm", ["install", "--no-frozen-lockfile"], { stdio: "inherit", shell: process.platform === "win32" });
  if (install.status !== 0) {
    console.error("\npnpm install failed. Run it yourself, then continue with the steps below.");
  }
}

/** Remove the two-ORM scaffolding from CI and the TypeScript and ESLint configs. */
function tidyConfigs(orm: Orm) {
  edit(".github/workflows/ci.yml", (s) =>
    s
      .replace(/^ *# Authforge ships both ORMs.*\n/m, "")
      .replace("orm: [drizzle, prisma]", `orm: [${orm}]`),
  );
  edit("tsconfig.json", (s) => s.replace('"exclude": ["node_modules", "orm"]', '"exclude": ["node_modules"]'));
  edit("eslint.config.mjs", (s) => s.replace(/^ *"orm\/\*\*",.*\n/m, ""));
}

function edit(path: string, change: (text: string) => string) {
  if (!existsSync(path)) return;
  const before = readFileSync(path, "utf8");
  const after = change(before);
  if (after !== before) writeFileSync(path, after);
}

function sortKeys(obj: Record<string, string>) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function printNextSteps() {
  console.log(`
Next steps:
  1. Set DATABASE_URL in .env (a free Neon database works: https://neon.tech)
  2. Put your email in ADMIN_EMAILS to become an admin when you sign up
  3. pnpm db:migrate
  4. pnpm dev  →  http://localhost:3000

Optional: add RESEND_API_KEY for real emails (otherwise they print to this terminal),
and Google / GitHub client IDs for social sign-in.
`);
}

void main();
