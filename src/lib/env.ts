import { z } from "zod";

/**
 * Server environment, validated once at boot.
 * A missing or malformed value fails fast with a readable message
 * instead of surfacing later as a confusing runtime error.
 */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.url({ message: "DATABASE_URL must be a Postgres connection URL" }),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters (run: openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.url().optional(),

  // Email (Resend). Without a key, emails are printed to the server console.
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("Authforge <onboarding@resend.dev>"),

  // OAuth providers. Each one is enabled only when both values are set.
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  GITHUB_CLIENT_ID: optional,
  GITHUB_CLIENT_SECRET: optional,

  // Comma-separated emails that become admins when they sign up.
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),

  // Set to "false" to skip the Have I Been Pwned password check (e.g. offline CI).
  PWNED_PASSWORD_CHECK: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}\n\nSee .env.example.`);
}

export const env = parsed.data;

/** Production base URL, falling back to Vercel's system variables. */
export const baseURL =
  env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const providers = {
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
};

export type EnabledProviders = typeof providers;
