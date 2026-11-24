import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:5186/one-minute-dungeon/", headless: true },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5186/one-minute-dungeon/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
