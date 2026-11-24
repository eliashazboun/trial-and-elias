import path from "node:path";
import { preview } from "vite";
import { root } from "./paths.mjs";
import { verifyBuild } from "./verify-build.mjs";
await verifyBuild();
const server = await preview({
  root,
  configFile: path.join(root, "vite.config.ts"),
});
server.printUrls();
