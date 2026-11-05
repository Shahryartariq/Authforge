import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Data Access Layer for the current session.
 * Every protected page, Server Action and Route Handler should go through
 * these helpers: the proxy only does an optimistic cookie check.
 *
 * With Cache Components, call these inside a <Suspense> boundary.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Returns the session, or redirects to sign-in. */
export async function requireSession(callbackURL?: string) {
  const session = await getSession();
  if (!session) {
    redirect(callbackURL ? `/sign-in?callbackURL=${encodeURIComponent(callbackURL)}` : "/sign-in");
  }
  return session;
}

export function isAdmin(role: string | null | undefined) {
  return (role ?? "")
    .split(",")
    .map((r) => r.trim())
    .includes("admin");
}

/** Returns the session of an admin, or redirects. */
export async function requireAdmin() {
  const session = await requireSession("/admin");
  if (!isAdmin(session.user.role)) redirect("/dashboard");
  return session;
}
