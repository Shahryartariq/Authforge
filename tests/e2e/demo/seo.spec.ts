import { expect, test } from "../support";

// Search and sharing basics, checked on the production build.

test("robots.txt allows the site, hides account pages and points to the sitemap", async ({ request, baseURL }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Allow: /");
  for (const path of ["/api/", "/dashboard", "/settings", "/admin"]) expect(body).toContain(`Disallow: ${path}`);
  expect(body).toContain(`Sitemap: ${baseURL}/sitemap.xml`);
});

test("the sitemap lists only public pages", async ({ request, baseURL }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  expect(body).toContain(`<loc>${baseURL}</loc>`);
  expect(body).toContain(`<loc>${baseURL}/privacy</loc>`);
  expect(body).not.toContain("sign-in");
  expect(body).not.toContain("dashboard");
});

test("the home page has a canonical URL, a social image and structured data", async ({ page, baseURL }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Next\.js auth starter/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${baseURL}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${baseURL}`);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toMatch(/^https?:\/\//);
  const image = await page.request.get(ogImage!);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");

  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  const types = data["@graph"].map((item: { "@type": string }) => item["@type"]);
  expect(types).toEqual(["WebSite", "SoftwareSourceCode"]);
});

test("sign-in and account pages ask search engines not to index them", async ({ page }) => {
  for (const path of ["/sign-in", "/sign-up", "/forgot-password", "/two-factor"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute("content", /noindex/);
  }
  await page.goto("/privacy");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test("icons and the web manifest are served", async ({ request }) => {
  for (const [path, type] of [
    ["/favicon.ico", "image/x-icon"],
    ["/apple-icon.png", "image/png"],
    ["/icon.svg", "image/svg+xml"],
    ["/manifest.webmanifest", "application/manifest+json"],
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["content-type"], path).toContain(type);
  }
});

test("pages load without console errors or Content Security Policy violations", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(e.message));
  await page.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (e) =>
      console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`),
    ),
  );
  for (const path of ["/", "/sign-in", "/sign-up", "/forgot-password", "/privacy"]) {
    await page.goto(path, { waitUntil: "networkidle" });
  }
  // Open the popup too: it loads the sign-in form on demand.
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("banner").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("dialog").locator("#email")).toBeVisible();
  expect(problems).toEqual([]);
});

test("the landing page loads only one web font", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "font") fonts.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  expect(fonts).toHaveLength(1);
  expect(fonts[0]).toContain(".woff2");
});
