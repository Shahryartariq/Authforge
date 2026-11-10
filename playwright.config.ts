import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests run against two servers on the same database:
 *
 * - "verification" (port 3100): email verification on, the way a real app
 *   runs. Emails are written to .e2e/outbox.jsonl so tests can follow
 *   verification, reset and delete links.
 * - "demo" (port 3200): verification off and no email provider, the way the
 *   live demo runs.
 *
 * Both are production builds (rate limits on, no dev compile delays), each in
 * its own folder because some pages are prerendered with these settings.
 *
 * Every test signs up its own users, so the tests can run in parallel and on a
 * database that already has data.
 */
const VERIFY_URL = "http://localhost:3100";
const DEMO_URL = "http://localhost:3200";

const shared = {
  PWNED_PASSWORD_CHECK: "false",
  RESEND_API_KEY: "",
  ADMIN_EMAILS: "",
  // Fake OAuth apps: the buttons render and redirect to the provider, which
  // the tests stop before leaving the site.
  GOOGLE_CLIENT_ID: "e2e-google-client",
  GOOGLE_CLIENT_SECRET: "e2e-google-secret",
  GITHUB_CLIENT_ID: "e2e-github-client",
  GITHUB_CLIENT_SECRET: "e2e-github-secret",
};

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "verification", testDir: "tests/e2e/verification", use: { baseURL: VERIFY_URL } },
    { name: "demo", testDir: "tests/e2e/demo", use: { baseURL: DEMO_URL } },
  ],
  webServer: [
    {
      command: "pnpm build && pnpm start --port 3100",
      url: VERIFY_URL,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...shared,
        NEXT_DIST_DIR: ".next-e2e-verification",
        BETTER_AUTH_URL: VERIFY_URL,
        REQUIRE_EMAIL_VERIFICATION: "true",
        EMAIL_OUTBOX_FILE: ".e2e/outbox.jsonl",
      },
    },
    {
      command: "pnpm build && pnpm start --port 3200",
      url: DEMO_URL,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...shared,
        NEXT_DIST_DIR: ".next-e2e-demo",
        BETTER_AUTH_URL: DEMO_URL,
        REQUIRE_EMAIL_VERIFICATION: "false",
      },
    },
  ],
});
