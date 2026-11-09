import { expect, PASSWORD, signIn, signOut, signUpDemo, test, uniqueEmail } from "../support";

// The production build with REQUIRE_EMAIL_VERIFICATION=false and no email
// provider: how the live demo runs.

test("sign-up says it's a demo and signs in right away", async ({ page }) => {
  const email = uniqueEmail("demo");
  await page.goto("/sign-up");
  await expect(page.getByText("Demo mode")).toBeVisible();
  await signUpDemo(page, "Demo Visitor", email);
  await expect(page.getByRole("heading", { name: "Hi, Demo" })).toBeVisible();
  await signOut(page);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("forgot password explains that email isn't set up", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByText("Email isn't set up")).toBeVisible();
});

test("deleting your account happens right away", async ({ page }) => {
  const email = uniqueEmail("demodelete");
  await signUpDemo(page, "Short Stay", email);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.fill("#delete-password", PASSWORD);
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/\/$/);
  await signIn(page, email);
  await expect(page.getByText("don't match")).toBeVisible();
});

test("the sixth sign-in attempt in a minute is rate limited", async ({ page }) => {
  await page.goto("/");
  const statuses = await page.evaluate(async () => {
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nobody@example.com", password: "wrong-pass-1" }),
      });
      codes.push(res.status);
    }
    return codes;
  });
  expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
  expect(statuses[5]).toBe(429);
});

test("security headers are set", async ({ page }) => {
  const response = (await page.goto("/sign-in"))!;
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("Back after leaving through the popup doesn't reopen it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/sign-up/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});
