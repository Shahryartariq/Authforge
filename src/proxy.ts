import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic redirect for protected routes based on the presence of a
 * session cookie. This is a fast UX check only: real authorization happens
 * on the server in src/lib/session.ts, close to the data.
 *
 * Signed-in users are not bounced away from /sign-in here on purpose:
 * a cookie can outlive its session, and that would cause a redirect loop.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("callbackURL", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*"],
};
