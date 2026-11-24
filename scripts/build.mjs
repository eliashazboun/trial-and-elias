import fs from "node:fs/promises";
import path from "node:path";
import { build } from "vite";
import { root, output } from "./paths.mjs";
import { applications } from "../project-manifest.mjs";
import { verifyBuild } from "./verify-build.mjs";
await build({ root, configFile: path.join(root, "vite.config.ts") });
for (const app of applications) {
  const appRoot = path.join(root, app.directory);
  await build({
    root: appRoot,
    configFile: path.join(appRoot, "vite.config.ts"),
  });
  const destination = path.resolve(output, app.slug);
  if (!destination.startsWith(output + path.sep))
    throw Error("Invalid application destination");
  await fs.cp(path.join(appRoot, "dist"), destination, { recursive: true });
}
await fs.writeFile(
  path.join(output, "build-manifest.json"),
  JSON.stringify(
    {
      worker: "trial-and-elias1",
      routes: ["/", ...applications.map((a) => "/" + a.slug + "/")],
    },
    null,
    2,
  ),
);
await verifyBuild();
console.log(
  "All three applications assembled into dist/. No deployment performed.",
);
