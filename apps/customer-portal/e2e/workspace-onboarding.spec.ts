import { randomUUID } from "node:crypto";
import { env } from "node:process";
import { expect, test } from "@playwright/test";

test("a new customer can create an account, workspace, and reach the product shell", async ({
  page,
}) => {
  test.skip(
    !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Configure the local Supabase public URL and publishable key to run the auth integration test.",
  );

  const email = `week-one-${randomUUID()}@example.test`;
  await page.goto("/");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("LocalWeekOnePass!2026");
  await page.getByRole("button", { name: "Create account", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Name your workspace" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel("Business or workspace name").fill("Week One Test Workspace");
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page.getByRole("heading", { name: "Week One Test Workspace" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Your Showoff workspace is ready.")).toBeVisible();
});
