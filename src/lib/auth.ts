import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, haveIBeenPwned, lastLoginMethod, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { baseURL, emailFeatures, env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import {
  deleteAccountTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "@/lib/email/templates";
import { site } from "@/lib/site";

const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account" as const,
        },
      }
    : {}),
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
    : {}),
};

export const auth = betterAuth({
  appName: site.name,
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL],

  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailFeatures.verificationRequired,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const mail = resetPasswordTemplate(user.name, url);
      await sendEmail({ to: user.email, ...mail });
    },
  },

  emailVerification: {
    sendOnSignUp: emailFeatures.verificationRequired,
    // An unverified user who tries to sign in gets a fresh link.
    sendOnSignIn: emailFeatures.verificationRequired,
    autoSignInAfterVerification: true,
    expiresIn: ONE_HOUR,
    sendVerificationEmail: async ({ user, url }) => {
      const mail = verifyEmailTemplate(user.name, url);
      await sendEmail({ to: user.email, ...mail });
    },
  },

  socialProviders,

  account: {
    accountLinking: {
      enabled: true,
      // Google and GitHub verify emails, so a matching account is linked automatically.
      trustedProviders: ["google", "github"],
    },
  },

  user: {
    deleteUser: {
      enabled: true,
      // Confirm by email when email works; otherwise the password (or a
      // fresh session) is the confirmation.
      ...(emailFeatures.delivery
        ? {
            sendDeleteAccountVerification: async ({ user, url }) => {
              const mail = deleteAccountTemplate(user.name, url);
              await sendEmail({ to: user.email, ...mail });
            },
          }
        : {}),
    },
  },

  session: {
    expiresIn: 7 * ONE_DAY,
    updateAge: ONE_DAY,
    // Short cache so bans and revocations take effect quickly.
    cookieCache: { enabled: true, maxAge: 2 * 60 },
  },

  rateLimit: {
    enabled: env.NODE_ENV === "production",
    // Database storage works across serverless instances; memory does not.
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 5 * 60, max: 3 },
      "/send-verification-email": { window: 5 * 60, max: 3 },
      "/two-factor/*": { window: 60, max: 5 },
      "/passkey/*": { window: 60, max: 10 },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Emails listed in ADMIN_EMAILS get the admin role on sign-up, but only
        // when the email is proven: verification is required before sign-in,
        // or the provider (Google/GitHub) already verified it. Without that,
        // anyone could sign up with the admin's address on a demo.
        before: async (user) => {
          const proven = emailFeatures.verificationRequired || user.emailVerified;
          if (proven && env.ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return { data: { ...user, role: "admin" } };
          }
        },
      },
    },
  },

  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    database: { generateId: "uuid" },
  },

  telemetry: { enabled: false },

  plugins: [
    twoFactor({
      issuer: site.name,
      backupCodeOptions: { amount: 10, length: 10 },
    }),
    passkey({
      rpID: new URL(baseURL).hostname,
      rpName: site.name,
      origin: baseURL,
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      impersonationSessionDuration: ONE_HOUR,
    }),
    lastLoginMethod(),
    ...(env.PWNED_PASSWORD_CHECK
      ? [
          haveIBeenPwned({
            customPasswordCompromisedMessage:
              "This password has appeared in a data breach. Please choose a different one.",
          }),
        ]
      : []),
    // Must stay last: lets Server Actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
