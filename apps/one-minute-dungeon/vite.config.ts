import { defineConfig } from "vitest/config";
export default defineConfig({
  base: "/one-minute-dungeon/",
  appType: "mpa",
  server: { host: "127.0.0.1", port: 5186, strictPort: true },
  test: { include: ["tests/**/*.test.ts"] },
});
