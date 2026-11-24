import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/nato-phonetic-alphabet-trainer/",
  appType: "mpa",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5185, strictPort: true },
  test: { include: ["tests/**/*.test.ts"] },
});
