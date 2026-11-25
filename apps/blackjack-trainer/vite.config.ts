import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/blackjack-trainer/",
  appType: "mpa",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5187, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
