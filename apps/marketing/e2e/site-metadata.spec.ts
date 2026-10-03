import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("prelaunch home is public and declares canonical, indexable metadata", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Showoff | Marketing for small businesses");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://showoff.marketing/",
  );

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Allow: /");

  const sitemap = await request.get("/sitemap.xml");
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain("<loc>https://showoff.marketing/</loc>");
  expect(sitemapXml).not.toContain("/pricing");
});

test("prelaunch explains the workflow and keeps unconfigured waitlist submission disabled", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Marketing, all in one place." })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "The Showoff marketing workflow" }).getByRole("listitem"),
  ).toHaveCount(7);
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Request early access" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Waitlist sign-up is not connected yet.");

  const reviewDirectory = resolve(process.cwd(), ".impeccable/review");
  await mkdir(reviewDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(reviewDirectory, "desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(reviewDirectory, "mobile.png"), fullPage: true });
});
