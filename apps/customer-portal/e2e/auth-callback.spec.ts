import { expect, test } from "@playwright/test";

test("an OAuth callback without an authorization code returns safely home", async ({ page }) => {
  await page.goto("/auth/callback");

  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle("Showoff");
});
