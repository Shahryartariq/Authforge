/**
 * End-to-end smoke test against a running server. CI runs it for both ORMs.
 *   pnpm build && pnpm start      (with REQUIRE_EMAIL_VERIFICATION=false)
 *   pnpm test:smoke               (in another terminal)
 *
 * Signs up a throwaway user, checks sign-in, the admin role and the admin
 * page's database queries, then deletes the user.
 */
import { setRoleByEmail } from "../src/db/queries";

const BASE = process.env.SMOKE_URL ?? "http://localhost:3000";
const stamp = Date.now();
const email = `smoke-${stamp}@example.com`;
const password = `Smoke-Pass-${stamp}`;
// A made-up client address, so repeated runs don't share one rate-limit bucket.
const ip = `198.51.100.${stamp % 250}`;
let failures = 0;

function check(ok: boolean, label: string) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
}

function cookiesFrom(res: Response) {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function api(path: string, body?: unknown, cookie = "") {
  return fetch(`${BASE}/api/auth${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", origin: BASE, cookie, "x-forwarded-for": ip },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function page(path: string, cookie: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie, "x-forwarded-for": ip }, redirect: "manual" });
  return { status: res.status, html: await res.text() };
}

async function main() {
  const home = await fetch(BASE);
  check(home.ok, `GET / → ${home.status}`);

  const signUp = await api("/sign-up/email", { name: "Smoke Test", email, password });
  let cookie = cookiesFrom(signUp);
  check(signUp.ok && cookie.length > 0, `sign up → ${signUp.status}, signed in`);

  const session = await (await api("/get-session", undefined, cookie)).json();
  check(session?.user?.email === email, "session belongs to the new user");

  const wrong = await api("/sign-in/email", { email, password: "not-the-password" });
  check(wrong.status === 401, `wrong password → ${wrong.status}`);

  const signIn = await api("/sign-in/email", { email, password });
  cookie = cookiesFrom(signIn);
  check(signIn.ok, `sign in → ${signIn.status}`);

  const forbidden = await api("/admin/list-users", undefined, cookie);
  check(forbidden.status === 403, `admin API as a normal user → ${forbidden.status}`);

  check(await setRoleByEmail(email, "admin"), "promote to admin (app query)");

  const allowed = await api("/admin/list-users", undefined, cookie);
  check(allowed.ok, `admin API as an admin → ${allowed.status}`);

  // The admin page runs the app's own queries: stats, list and search.
  // The signed-in email is always on the page (account menu), so compare how
  // often it appears with a matching and a non-matching search.
  const hit = await page(`/admin?q=${encodeURIComponent(`SMOKE-${stamp}`)}`, cookie);
  const miss = await page(`/admin?q=no-such-user-${stamp}`, cookie);
  const times = (html: string) => html.split(email).length - 1;
  check(hit.status === 200 && /Using 2FA/.test(hit.html), "admin page loads with its stats");
  check(times(hit.html) > times(miss.html), "admin search finds the user, ignoring case, and leaves out others");

  const del = await api("/delete-user", { password }, cookie);
  check(del.ok, `clean up: delete the user → ${del.status}`);

  if (failures) {
    console.error(`\n${failures} smoke check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
