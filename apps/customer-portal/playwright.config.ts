import { defineConfig, devices } from "@playwright/test";
import { env } from "node:process";
import { loadEnv } from "vite";

for (const [key, value] of Object.entries(loadEnv("development", process.cwd(), "VITE_"))) {
  env[key] ??= value;
}

const baseURL = "http://127.0.0.1:3000";

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
    command: "npm run dev -- --host 127.0.0.1 --strictPort",
    url: baseURL,
    reuseExistingServer: !env.CI,
    timeout: 120_000,
  },
});
