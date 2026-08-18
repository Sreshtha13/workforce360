import { defineConfig, devices } from "@playwright/test";

const webBase = process.env.PLAYWRIGHT_WEB_URL ?? "http://localhost:3000";
const apiBase = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:4000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: webBase,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: "npm run dev:api",
          url: `${apiBase}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: "npm run dev:web",
          url: webBase,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
