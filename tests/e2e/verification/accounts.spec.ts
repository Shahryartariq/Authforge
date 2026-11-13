import {
  emailLink,
  expect,
  fillSignUp,
  newPassword,
  PASSWORD,
  sessionStatus,
  signIn,
  signOut,
  signUpVerified,
  test,
  uniqueEmail,
} from "../support";

test.describe("signed-out visitors", () => {
  test("protected pages redirect to sign-in", async ({ page }) => {
    for (const path of ["/dashboard", "/settings", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in\?callbackURL=/);
    }
  });

  test("the admin API rejects them", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(async () => (await fetch("/api/auth/admin/list-users")).status)).toBe(401);
  });

  test("an external callbackURL is ignored", async ({ page }) => {
    for (const target of ["https://evil.example", "//evil.example"]) {
      await page.goto(`/sign-in?callbackURL=${encodeURIComponent(target)}`);
      await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/sign-up");
    }
  });

  test("unknown pages return 404", async ({ page }) => {
    expect((await page.goto("/no-such-page"))!.status()).toBe(404);
  });
});

test.describe("sign-up and sign-in", () => {
  test("the form explains what is wrong", async ({ page }) => {
    await page.goto("/sign-up");
    await page.click("button[type=submit]");
    await expect(page.getByText("Enter your name")).toBeVisible();
    await page.fill("#name", "X");
    await page.fill("#email", "not-an-email");
    await page.fill("#password", "short");
    await page.fill("#confirmPassword", "different");
    await page.click("button[type=submit]");
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters")).toBeVisible();
  });

  test("an unverified email can't sign in; the emailed link verifies and signs in", async ({ page }) => {
    const email = uniqueEmail("verify");
    await fillSignUp(page, "Ada Lovelace", email);
    await expect(page.getByText("Check your inbox")).toBeVisible();

    const firstLink = await emailLink(email, "verify");

    // Signing in before verifying is refused and sends a fresh link.
    await signIn(page, email);
    await expect(page.getByText("verify your email")).toBeVisible();
    await expect.poll(() => emailLink(email, "verify")).not.toBe(firstLink);

    // The sign-up email's link shows a confirmation page, then the dashboard.
    await page.goto(firstLink);
    await expect(page.getByText("Email verified")).toBeVisible();
    await page.getByRole("link", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Hi, Ada" })).toBeVisible();
  });

  test("a wrong password is rejected, the right one works", async ({ page }) => {
    const email = uniqueEmail("password");
    await signUpVerified(page, "Grace Hopper", email);
    await signOut(page);
    await signIn(page, email, newPassword());
    await expect(page.getByText("don't match")).toBeVisible();
    await signIn(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("signing in from a protected page takes you back to it", async ({ page }) => {
    const email = uniqueEmail("callback");
    await signUpVerified(page, "Call Back", email);
    await signOut(page);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/sign-in\?callbackURL=%2Fsettings/);
    await page.fill("#email", email);
    await page.fill("#password", PASSWORD);
    await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("password reset by email", async ({ page }) => {
    const email = uniqueEmail("reset");
    await signUpVerified(page, "Reset Me", email);
    await signOut(page);

    await page.goto("/forgot-password");
    await page.fill("#email", email);
    await page.click("button[type=submit]");
    await expect(page.getByText("reset link is on its way")).toBeVisible();

    await page.goto(await emailLink(email, "reset"));
    await expect(page).toHaveURL(/reset-password\?token=/);
    const fresh = newPassword();
    await page.fill("#password", fresh);
    await page.fill("#confirmPassword", fresh);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/sign-in/);

    await signIn(page, email);
    await expect(page.getByText("don't match")).toBeVisible();
    await signIn(page, email, fresh);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("account settings", () => {
  test("profile name change saves", async ({ page }) => {
    await signUpVerified(page, "Lin Example", uniqueEmail("profile"));
    await page.goto("/settings");
    await page.fill("#profile-name", "Lin Renamed");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Hi, Lin" })).toBeVisible();
  });

  test("changing the password signs out other devices; 'sign out other sessions' works", async ({
    page,
    newPerson,
  }) => {
    const email = uniqueEmail("sessions");
    await signUpVerified(page, "Two Devices", email);

    const laptop = await newPerson();
    await signIn(laptop, email);
    await expect(laptop).toHaveURL(/\/dashboard/);

    await page.goto("/settings");
    await expect(page.getByText("This device")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(1);

    const second = newPassword();
    await page.fill("#currentPassword", newPassword());
    await page.fill("#newPassword", second);
    await page.fill("#confirmPassword", second);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("That password isn't right")).toBeVisible();

    await page.fill("#currentPassword", PASSWORD);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password changed")).toBeVisible();
    expect(await sessionStatus(laptop)).toBe(401);

    await signIn(laptop, email, second);
    await expect(laptop).toHaveURL(/\/dashboard/);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out of all other sessions" }).click();
    await expect(page.getByText("Signed out of all other sessions")).toBeVisible();
    expect(await sessionStatus(laptop)).toBe(401);
    expect(await sessionStatus(page)).toBe(200);
  });

  test("deleting your account needs the emailed confirmation", async ({ page }) => {
    const email = uniqueEmail("delete");
    await signUpVerified(page, "Leaving Soon", email);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Delete account" }).click();
    await page.fill("#delete-password", PASSWORD);
    await page.getByRole("button", { name: "Send confirmation email" }).click();
    await expect(page.getByText("We emailed you a confirmation link")).toBeVisible();

    await page.goto(await emailLink(email, "delete"));
    await signIn(page, email);
    await expect(page.getByText("don't match")).toBeVisible();
  });
});

test.describe("Google and GitHub", () => {
  test("the buttons send you to the provider with this site's callback", async ({ page }) => {
    for (const [name, host, callback] of [
      ["GitHub", "github.com", "/api/auth/callback/github"],
      ["Google", "accounts.google.com", "/api/auth/callback/google"],
    ] as const) {
      await page.goto("/sign-in");
      const request = page.waitForRequest((r) => new URL(r.url()).host === host);
      await page.route(`https://${host}/**`, (route) => route.abort());
      await page.getByRole("button", { name, exact: true }).click();
      const url = new URL((await request).url());
      expect(url.searchParams.get("client_id")).toContain("e2e-");
      expect(url.searchParams.get("redirect_uri")).toBe(`${new URL(page.url()).origin}${callback}`);
      await page.unroute(`https://${host}/**`);
    }
  });

  test("provider errors show a message you can act on", async ({ page }) => {
    await page.goto("/sign-in?error=account_not_linked");
    await expect(page.getByText("Sign in with your password, then connect Google or GitHub")).toBeVisible();
    await page.goto("/sign-in?error=BANNED_USER");
    await expect(page.getByText("This account has been suspended")).toBeVisible();
  });
});

test("no sideways scroll at phone width", async ({ browser, baseURL }) => {
  const phone = await browser.newContext({ baseURL, viewport: { width: 360, height: 780 } });
  const page = await phone.newPage();
  for (const path of ["/", "/sign-in", "/sign-up", "/forgot-password"]) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
      path,
    ).toBe(false);
  }
  await phone.close();
});
