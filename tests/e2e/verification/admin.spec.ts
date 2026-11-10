import {
  expect,
  PASSWORD,
  promoteToAdmin,
  sessionStatus,
  signIn,
  signUpVerified,
  test,
  uniqueEmail,
  type Page,
} from "../support";

/** Signs up a user, makes them admin with `pnpm admin:promote`, and opens /admin. */
async function signInAsAdmin(page: Page) {
  const email = uniqueEmail("admin");
  await signUpVerified(page, "Ada Admin", email);
  promoteToAdmin(email);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
  return email;
}

async function rowAction(admin: Page, email: string, action: string) {
  await admin.getByRole("button", { name: `Actions for ${email}` }).click();
  await admin.getByRole("menuitem", { name: action }).click();
}

test("non-admins can't open the admin panel or its API", async ({ page }) => {
  await signUpVerified(page, "Regular User", uniqueEmail("regular"));
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
  expect(await page.evaluate(async () => (await fetch("/api/auth/admin/list-users")).status)).toBe(403);
});

test("search ignores case and matches name or email", async ({ page, newPerson }) => {
  const target = uniqueEmail("findme");
  await signUpVerified(await newPerson(), "Searchable Person", target);
  await signInAsAdmin(page);

  await page.goto(`/admin?q=${encodeURIComponent(target.toUpperCase())}`);
  await expect(page.getByText("1 user", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Actions for ${target}` })).toBeVisible();

  await page.goto(`/admin?q=${encodeURIComponent(target.split("@")[0].slice(0, 6))}_`);
  await expect(page.getByRole("button", { name: `Actions for ${target}` })).toHaveCount(0);
});

test("ban stops an open session at once; unban and impersonate", async ({ page, newPerson }) => {
  const email = uniqueEmail("banned");
  const user = await newPerson();
  await signUpVerified(user, "Banned Person", email);
  await signInAsAdmin(page);
  await page.goto(`/admin?q=${encodeURIComponent(email)}`);

  await rowAction(page, email, "Ban…");
  await page.fill("#ban-reason", "Spam");
  await page.getByRole("radio", { name: "7 days" }).click();
  await page.getByRole("button", { name: "Ban user" }).click();
  await expect(page.getByText(/Banned until/)).toBeVisible();

  expect(await sessionStatus(user)).toBe(401);
  await signIn(user, email);
  await expect(user.getByText("suspended")).toBeVisible();

  await rowAction(page, email, "Unban");
  await expect(page.getByText("was unbanned")).toBeVisible();
  await signIn(user, email);
  await expect(user).toHaveURL(/\/dashboard/);

  await rowAction(page, email, "Impersonate");
  await expect(page.getByRole("heading", { name: "Hi, Banned" })).toBeVisible();
  await expect(page.getByText("impersonation")).toBeVisible();
  await page.getByRole("button", { name: "Stop impersonating" }).click();
  await expect(page).toHaveURL(/\/admin/);
});

test("roles, sign out everywhere, create and delete users", async ({ page, newPerson }) => {
  const email = uniqueEmail("managed");
  const user = await newPerson();
  await signUpVerified(user, "Managed Person", email);
  await signInAsAdmin(page);
  await page.goto(`/admin?q=${encodeURIComponent(email)}`);

  await rowAction(page, email, "Make admin");
  await expect(page.getByText("is now an admin")).toBeVisible();
  await user.goto("/admin");
  await expect(user).toHaveURL(/\/admin/);
  await rowAction(page, email, "Remove admin role");
  await expect(page.getByText("is now a user")).toBeVisible();

  await rowAction(page, email, "Sign out everywhere");
  await expect(page.getByText("All sessions revoked")).toBeVisible();
  expect(await sessionStatus(user)).toBe(401);

  const created = uniqueEmail("created");
  await page.getByRole("button", { name: "Create user" }).click();
  await page.fill("#cu-name", "Made By Admin");
  await page.fill("#cu-email", created);
  await page.fill("#cu-password", PASSWORD);
  await page.getByRole("dialog").getByRole("button", { name: "Create user" }).click();
  await expect(page.getByText(`Created ${created}`)).toBeVisible();
  const newcomer = await newPerson();
  await signIn(newcomer, created);
  await expect(newcomer).toHaveURL(/\/dashboard/);

  await page.goto(`/admin?q=${encodeURIComponent(created)}`);
  await rowAction(page, created, "Delete user");
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete user" }).click();
  await expect(page.getByText(`${created} was deleted`)).toBeVisible();
  await signIn(newcomer, created);
  await expect(newcomer.getByText("don't match")).toBeVisible();
});
