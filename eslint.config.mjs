import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "orm/**", // the Prisma option, until `pnpm env:setup` picks an ORM
  ]),
]);

export default eslintConfig;
