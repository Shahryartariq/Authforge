import {
  addPasskey,
  addVirtualAuthenticator,
  enableTwoFactor,
  expect,
  PASSWORD,
  signIn,
  signOut,
  signUpVerified,
  test,
  totp,
  uniqueEmail,
} from "../support";

test.describe("two-factor authentication", () => {
  test("setup rejects a wrong code; sign-in then asks for a code", async ({ page }) => {
    const email = uniqueEmail("totp");
    await signUpVerified(page, "Two Factor", email);

    await page.goto("/settings");
    await page.getByRole("button", { name: "Turn on 2FA" }).click();
    await page.fill("#tfa-password", PASSWORD);
    await page.getByRole("button", { name: "Continue" }).click();
    const secret = (await page.locator("code").first().textContent())!.trim();
    await page.fill("#tfa-code", "000000");
    await page.getByRole("button", { name: "Verify and turn on" }).click();
    await expect(page.getByText("isn't right")).toBeVisible();
    await page.fill("#tfa-code", totp(secret));
    await page.getByRole("button", { name: "Verify and turn on" }).click();
    await expect(page.getByText("Save your backup codes")).toBeVisible();
    await expect(page.locator(".font-mono span")).toHaveCount(10);
    await page.getByRole("button", { name: "I've saved them" }).click();

    await signOut(page);
    await signIn(page, email);
    await expect(page).toHaveURL(/\/two-factor/);
    await page.fill("#code", "000000");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("isn't right")).toBeVisible();
    await page.fill("#code", totp(secret));
    await page.getByRole("checkbox", { name: "Trust this device for 30 days" }).click();
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // A trusted device skips the code next time.
    await signOut(page);
    await signIn(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("a backup code works once; 2FA can be turned off", async ({ page, newPerson }) => {
    const email = uniqueEmail("backup");
    await signUpVerified(page, "Backup Codes", email);
    const { backupCodes } = await enableTwoFactor(page);

    const phone = await newPerson();
    await signIn(phone, email);
    await expect(phone).toHaveURL(/\/two-factor/);
    await phone.getByRole("button", { name: "Use a backup code" }).click();
    await phone.fill("#code", backupCodes[0]);
    await phone.getByRole("button", { name: "Verify" }).click();
    await expect(phone).toHaveURL(/\/dashboard/);

    const tablet = await newPerson();
    await signIn(tablet, email);
    await tablet.getByRole("button", { name: "Use a backup code" }).click();
    await tablet.fill("#code", backupCodes[0]);
    await tablet.getByRole("button", { name: "Verify" }).click();
    await expect(tablet.getByText("isn't valid or was already used")).toBeVisible();

    await page.goto("/settings");
    await page.getByRole("button", { name: "Turn off" }).click();
    await page.fill("#tfa-password", PASSWORD);
    await page.getByRole("button", { name: "Turn off 2FA" }).click();
    await expect(page.getByText("Two-factor authentication turned off")).toBeVisible();
    await signOut(page);
    await signIn(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("passkeys", () => {
  test("add a passkey, sign in with it, remove it", async ({ page }) => {
    await addVirtualAuthenticator(page);
    await signUpVerified(page, "Pass Key", uniqueEmail("passkey"));
    await addPasskey(page, "Test laptop");
    await expect(page.getByText("Test laptop")).toBeVisible();

    await signOut(page);
    // The virtual authenticator also answers the page's passkey autofill on its
    // own, which can sign in before the click. Either way is a passkey sign-in.
    await page
      .getByRole("button", { name: "Sign in with a passkey" })
      .click({ timeout: 3_000 })
      .catch(() => {});
    await expect(page.getByRole("heading", { name: "Hi, Pass" })).toBeVisible();

    await page.goto("/settings");
    await page.getByRole("button", { name: "Remove Test laptop" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove passkey" }).click();
    await expect(page.getByText("Passkey removed")).toBeVisible();
  });
});
