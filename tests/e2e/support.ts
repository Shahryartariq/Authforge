import { execFileSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

export { expect };
export type { Page };

/** A made-up client address, so production rate limits apply per simulated person. */
function randomIp() {
  const [a, b, c] = randomBytes(3);
  return `10.${a}.${b}.${c || 1}`;
}

type Fixtures = {
  /** Opens a page in a fresh browser context: another person, or another device. */
  newPerson: () => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  extraHTTPHeaders: async ({}, provide) => {
    await provide({ "x-forwarded-for": randomIp() });
  },
  newPerson: async ({ browser, baseURL }, provide) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await provide(async () => {
      const context = await browser.newContext({
        baseURL,
        extraHTTPHeaders: { "x-forwarded-for": randomIp() },
      });
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((c) => c.close()));
  },
});

/** A unique address per call, so tests never collide in a shared database. */
export function uniqueEmail(label = "user") {
  return `${label}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}@example.com`;
}

/**
 * A strong password, made fresh each time so no password is written in the code
 * (secret scanners rightly flag those).
 */
export function newPassword() {
  return `Pw-${randomBytes(12).toString("base64url")}-7`;
}

/** The password test users sign up with. */
export const PASSWORD = newPassword();

// ---------------------------------------------------------------- email

const OUTBOX = resolve(".e2e/outbox.jsonl");

const LINKS = {
  verify: /(https?:\/\/\S+\/verify-email\?token=\S+)/,
  reset: /(https?:\/\/\S+\/reset-password\/\S+)/,
  delete: /(https?:\/\/\S+\/delete-user\S+)/,
};

/** Waits for the newest email of a kind sent to `to` and returns its link. */
export async function emailLink(to: string, kind: keyof typeof LINKS) {
  let link: string | undefined;
  await expect
    .poll(
      () => {
        if (!existsSync(OUTBOX)) return undefined;
        const emails = readFileSync(OUTBOX, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as { to: string; text: string })
          .filter((e) => e.to === to)
          .reverse();
        link = emails.map((e) => e.text.match(LINKS[kind])?.[1]).find(Boolean);
        return link;
      },
      { message: `${kind} email for ${to}`, timeout: 15_000 },
    )
    .toBeTruthy();
  return link!;
}

// ---------------------------------------------------------------- flows

export async function fillSignUp(page: Page, name: string, email: string, password = PASSWORD) {
  await page.goto("/sign-up");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.click("button[type=submit]");
}

/** Verification mode: sign up, open the emailed link, land on the dashboard. */
export async function signUpVerified(page: Page, name: string, email: string, password = PASSWORD) {
  await fillSignUp(page, name, email, password);
  await expect(page.getByText("Check your inbox")).toBeVisible();
  await page.goto(await emailLink(email, "verify"));
  await expect(page.getByText("Email verified")).toBeVisible();
  await page.getByRole("link", { name: "Continue" }).click();
  await page.waitForURL(/\/dashboard/);
}

/** Demo mode: sign-up signs in right away. */
export async function signUpDemo(page: Page, name: string, email: string, password = PASSWORD) {
  await fillSignUp(page, name, email, password);
  await page.waitForURL(/\/dashboard/);
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/sign-in");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/sign-in/);
}

/** Status of an authenticated API call from the page, to check a session is still alive. */
export async function sessionStatus(page: Page) {
  return page.evaluate(async () => (await fetch("/api/auth/list-sessions")).status);
}

/** Gives a user the admin role with the project's own script. */
export function promoteToAdmin(email: string) {
  execFileSync("pnpm", ["exec", "tsx", "scripts/promote-admin.ts", email], {
    stdio: "pipe",
    shell: process.platform === "win32",
  });
}

// ---------------------------------------------------------------- 2FA and passkeys

export async function enableTwoFactor(page: Page, password = PASSWORD) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Turn on 2FA" }).click();
  await page.fill("#tfa-password", password);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Set up your authenticator app")).toBeVisible();
  const secret = (await page.locator("code").first().textContent())!.trim();
  await page.fill("#tfa-code", totp(secret));
  await page.getByRole("button", { name: "Verify and turn on" }).click();
  await expect(page.getByText("Save your backup codes")).toBeVisible();
  const backupCodes = await page.locator(".font-mono span").allTextContents();
  await page.getByRole("button", { name: "I've saved them" }).click();
  return { secret, backupCodes };
}

/** RFC 6238 code for a base32 secret, like an authenticator app. */
export function totp(secret: string, offset = 0) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  }
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + offset));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offsetByte = hmac[hmac.length - 1] & 0xf;
  return ((hmac.readUInt32BE(offsetByte) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

/** A software passkey authenticator for this page's browser context. */
export async function addVirtualAuthenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

export async function addPasskey(page: Page, name: string) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Add a passkey" }).click();
  await page.fill("#passkey-name", name);
  await page.getByRole("button", { name: "Create passkey" }).click();
  await expect(page.getByText("Passkey added")).toBeVisible();
}
