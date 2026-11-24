import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:8787",
    headless: true,
    launchOptions: {
      args: [
        "--host-resolver-rules=MAP insecure.test 127.0.0.1",
        "--no-proxy-server",
      ],
    },
  },
  webServer: {
    command: "npm run worker:serve",
    url: "http://127.0.0.1:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  reporter: "list",
});
