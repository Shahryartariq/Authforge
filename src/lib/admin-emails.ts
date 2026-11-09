/**
 * Whether a new user should get the admin role from ADMIN_EMAILS.
 *
 * Only when the email is proven: either verification is required before
 * anyone can sign in, or the provider (Google, GitHub) already verified it.
 * Otherwise anyone could sign up with the admin's address on a demo.
 */
export function isListedAdmin(
  user: { email: string; emailVerified: boolean },
  adminEmails: string[],
  verificationRequired: boolean,
) {
  const proven = verificationRequired || user.emailVerified;
  return proven && adminEmails.includes(user.email.trim().toLowerCase());
}
