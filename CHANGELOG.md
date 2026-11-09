# Changelog

## 1.0.0 (2026-11-10)

The first stable release: a reusable auth starter for Next.js with a live demo at [getauthforge.vercel.app](https://getauthforge.vercel.app).

### Sign-in
- Email and password with email verification, password reset and breached-password checks (Have I Been Pwned).
- Google and GitHub sign-in, with automatic account linking only when both emails are verified.
- Two-factor authentication: authenticator apps, 10 one-time backup codes, trusted devices for 30 days.
- Passkeys (Face ID, Touch ID, Windows Hello, security keys), including browser autofill.
- Sign in from a popup on any page, or on the full /sign-in page.

### Accounts and admin
- Settings: profile, password change (signs out other devices), 2FA, passkeys, connected accounts, active sessions, delete account.
- Admin panel: case-insensitive search, roles, bans with a reason and length, sign out everywhere, impersonation, create and delete users.
- `ADMIN_EMAILS` gives listed addresses the admin role, only once the email is proven.

### Setup and deployment
- `pnpm env:setup` creates `.env` and lets you pick **Drizzle or Prisma**; the other one's files are removed.
- Demo mode (`REQUIRE_EMAIL_VERIFICATION=false`) for deployments without an email provider.
- One-click Vercel deploy; migrations run on production deploys.
- UI built with shadcn/ui, light and dark themes.

### Security
- Sessions are checked in the database on every request, so bans and sign-outs take effect at once.
- Database-backed rate limits (the sixth sign-in attempt in a minute is refused).
- Strict Content Security Policy and security headers; open-redirect guard on `callbackURL`.

### Quality
- 33 Playwright browser tests against two production builds (verification on, and demo mode).
- Unit tests, a schema drift check and a smoke test; CI runs the full pipeline for both Drizzle and Prisma.

### Fixes before 1.0
- A two-minute session cache kept revoked and banned sessions working (#4).
- Prisma search treated `%` and `_` as wildcards; Prisma saw a schema change that never went away (#7).
- The sign-in popup stayed open after pressing Back (#9).
- Clicking "Sign in with a passkey" as /sign-in loaded could fail with "Challenge not found" (#12).
