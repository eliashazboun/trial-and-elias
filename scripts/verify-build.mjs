import fs from "node:fs/promises";
import path from "node:path";
import { root, output } from "./paths.mjs";
import { applications } from "../project-manifest.mjs";
export async function verifyBuild() {
  for (const relative of [
    "index.html",
    "404.html",
    ...applications.map((a) => a.slug + "/index.html"),
  ]) {
    const file = path.join(output, relative);
    const html = await fs.readFile(file, "utf8");
    for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      const url = match[1];
      if (!url || url.startsWith("#") || /^(?:https?:|data:|mailto:)/.test(url))
        continue;
      const pathname = new URL(url, "https://trialandelias.com/" + relative)
        .pathname;
      if (pathname.endsWith("/") || pathname === "/") continue;
      await fs.access(path.join(output, decodeURIComponent(pathname)));
    }
    if (/[A-Z]:[\\/](?:Users|Code)/.test(html))
      throw Error("Local filesystem path in " + relative);
  }
  const manifest = JSON.parse(
    await fs.readFile(path.join(output, "build-manifest.json"), "utf8"),
  );
  if (manifest.worker !== "trial-and-elias1")
    throw Error("Unexpected build target");
  return manifest;
}
if (process.argv[1] === path.join(root, "scripts", "verify-build.mjs")) {
  await verifyBuild();
  console.log("Unified production output verified.");
}
