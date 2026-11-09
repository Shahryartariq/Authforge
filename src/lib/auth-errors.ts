type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  EMAIL_NOT_VERIFIED: "Please verify your email first. We've sent you a new link.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Try signing in.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Try signing in.",
  PASSWORD_COMPROMISED: "This password has appeared in a data breach. Please choose a different one.",
  PASSWORD_TOO_SHORT: "That password is too short.",
  BANNED_USER: "This account has been suspended. Contact support if you think this is a mistake.",
  INVALID_CODE: "That code isn't right. Check your authenticator app and try again.",
  INVALID_BACKUP_CODE: "That backup code isn't valid or was already used.",
  INVALID_TWO_FACTOR_COOKIE: "Your sign-in attempt expired. Please sign in again.",
  ACCOUNT_TEMPORARILY_LOCKED: "Too many wrong codes. Wait a few minutes, then try again.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Please try again later.",
  INVALID_TOKEN: "This link is invalid or has expired. Request a new one.",
  SESSION_EXPIRED: "For security, please sign in again to do this.",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't remove your only sign-in method.",
};

/** Maps a Better Auth error to a message a user can act on. */
export function authErrorMessage(error: AuthError, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return error.message || fallback;
}

/**
 * Google and GitHub sign-in errors arrive as `?error=<code>` on /sign-in.
 * Codes come from Better Auth's OAuth callback.
 */
const OAUTH_MESSAGES: Record<string, string> = {
  account_not_linked:
    "An account with this email already exists. Sign in with your password, then connect Google or GitHub in Settings.",
  email_not_found:
    "We couldn't get an email address from that account. On GitHub, add a verified email and try again.",
  email_not_verified: "That account's email isn't verified with the provider yet. Verify it there, then try again.",
  email_does_not_match: "That account uses a different email address than yours.",
  account_already_linked_to_different_user: "That account is already connected to a different user.",
  BANNED_USER: MESSAGES.BANNED_USER,
  signup_disabled: "Sign-up is closed. Ask an admin for an account.",
};

/** Message for an `?error=` code on /sign-in, or "" when there is none. */
export function oauthErrorMessage(code: string | null | undefined) {
  if (!code) return "";
  return OAUTH_MESSAGES[code] ?? "Sign-in failed. Please try again.";
}
