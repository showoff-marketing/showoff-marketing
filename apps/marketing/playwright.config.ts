import { defineConfig, devices } from "@playwright/test";
import { env } from "node:process";

const baseURL = "http://127.0.0.1:4321";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm run dev:e2e",
    url: baseURL,
    reuseExistingServer: !env.CI,
    timeout: 120_000,
  },
});
