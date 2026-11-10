import {
  addPasskey,
  addVirtualAuthenticator,
  enableTwoFactor,
  expect,
  newPassword,
  PASSWORD,
  signOut,
  signUpVerified,
  test,
  totp,
  uniqueEmail,
  type Page,
} from "../support";

async function openPopup(page: Page) {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Sign in" }).click();
  const dialog = page.getByRole("dialog", { name: "Welcome back" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("opens on the landing page without leaving it; Escape closes it", async ({ page }) => {
  await openPopup(page);
  await expect(page).toHaveURL(/\/$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("errors show inside the popup; the right password signs in", async ({ page }) => {
  const email = uniqueEmail("popup");
  await signUpVerified(page, "Pop Up", email);
  await signOut(page);

  const dialog = await openPopup(page);
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(dialog.getByText("Enter a valid email address")).toBeVisible();
  await dialog.locator("#email").fill(email);
  await dialog.locator("#password").fill(newPassword());
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(dialog.getByText("don't match")).toBeVisible();
  await dialog.locator("#password").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hi, Pop" })).toBeVisible();

  // Back to the landing page: the popup must not still be open.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("passkey and 2FA sign-in work from the popup", async ({ page }) => {
  await addVirtualAuthenticator(page);
  const email = uniqueEmail("popup2fa");
  await signUpVerified(page, "Pop Key", email);
  await addPasskey(page, "Pop key");
  await signOut(page);

  const dialog = await openPopup(page);
  await dialog.getByRole("button", { name: "Sign in with a passkey" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const { secret } = await enableTwoFactor(page);
  await signOut(page);
  const again = await openPopup(page);
  await again.locator("#email").fill(email);
  await again.locator("#password").fill(PASSWORD);
  await again.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/two-factor/);
  await page.fill("#code", totp(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("links inside the popup work and close it", async ({ page }) => {
  for (const [link, path] of [
    ["Create an account", /\/sign-up/],
    ["Forgot password?", /\/forgot-password/],
  ] as const) {
    const dialog = await openPopup(page);
    await dialog.getByRole("link", { name: link }).click();
    await expect(page).toHaveURL(path);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  }
});

test("/sign-in still works as a full page", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the popup fits a phone screen", async ({ browser, baseURL }) => {
  const phone = await browser.newContext({ baseURL, viewport: { width: 360, height: 780 } });
  const page = await phone.newPage();
  const dialog = await openPopup(page);
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  await phone.close();
});
