import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "../../tests/e2e",
  testMatch: "blackjack.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:8787", headless: true },
  webServer: {
    command: "npm run worker:serve --prefix ../..",
    url: "http://127.0.0.1:8787/",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
