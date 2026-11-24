import { defineConfig } from "vite";
import { renderProjects } from "./src/home/projects";
export default defineConfig({
  appType: "mpa",
  plugins: [
    {
      name: "existing-homepage-projects",
      transformIndexHtml(html) {
        return html.replace(
          /<!-- PROJECT_CARDS_START -->[\s\S]*?<!-- PROJECT_CARDS_END -->/,
          "<!-- PROJECT_CARDS_START -->" +
            renderProjects() +
            "<!-- PROJECT_CARDS_END -->",
        );
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost");
          if (
            ["/one-minute-dungeon", "/nato-phonetic-alphabet-trainer"].includes(
              url.pathname,
            )
          ) {
            res.statusCode = 308;
            res.setHeader("Location", url.pathname + "/" + url.search);
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
    proxy: {
      "/nato-phonetic-alphabet-trainer/": {
        target: "http://127.0.0.1:5185",
        ws: true,
      },
      "/one-minute-dungeon/": { target: "http://127.0.0.1:5186", ws: true },
    },
  },
  preview: { host: "127.0.0.1", port: 4175, strictPort: true, proxy: {} },
  build: { outDir: "dist", emptyOutDir: true },
});
