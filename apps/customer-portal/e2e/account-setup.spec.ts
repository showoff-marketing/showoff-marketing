import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("customer sign-in provides password and OAuth account entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SIGN IN TO SHOWOFF" })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Account setup progress" }).getByRole("listitem"),
  ).toHaveText(["Account", "Workspace", "Team"]);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Apple" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");

  const reviewDirectory = resolve(process.cwd(), ".impeccable/review");
  await mkdir(reviewDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: resolve(reviewDirectory, "desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: resolve(reviewDirectory, "mobile.png"), fullPage: true });
});

test("new accounts receive the workspace setup guidance after the account step", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "CREATE YOUR ACCOUNT" })).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeVisible();
});
