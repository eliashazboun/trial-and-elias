import path from "node:path";
import { createServer } from "vite";
import { root } from "./paths.mjs";
import { applications } from "../project-manifest.mjs";
const servers = [];
async function close() {
  await Promise.all(servers.map((s) => s.close()));
}
process.once("SIGINT", () => void close().then(() => process.exit(0)));
process.once("SIGTERM", () => void close().then(() => process.exit(0)));
try {
  for (const app of applications) {
    const appRoot = path.join(root, app.directory),
      server = await createServer({
        root: appRoot,
        configFile: path.join(appRoot, "vite.config.ts"),
      });
    servers.push(server);
    await server.listen();
  }
  const home = await createServer({
    root,
    configFile: path.join(root, "vite.config.ts"),
  });
  servers.push(home);
  await home.listen();
  console.log("Trial & Elias: http://127.0.0.1:5175/");
  for (const app of applications)
    console.log("  http://127.0.0.1:5175/" + app.slug + "/");
} catch (error) {
  await close();
  throw error;
}
