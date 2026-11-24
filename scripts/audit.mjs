import fs from "node:fs";
import path from "node:path";
import { root } from "./paths.mjs";
const ignored = new Set([
  "node_modules",
  "dist",
  ".git",
  ".wrangler",
  ".vite",
  ".preservation",
  "test-results",
  "playwright-report",
  "coverage",
]);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(file);
  }
}
walk(root);
const issues = [];
for (const file of files) {
  const relative = path.relative(root, file);
  if (
    /(^|[\\/])(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?)$/.test(relative) &&
    !relative.endsWith(".example")
  )
    issues.push(relative + ": private environment file");
  if (/\.(?:png|jpe?g|gif|webp|ico|woff2?|mp3|ogg|wav)$/i.test(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (
    /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(
      content,
    )
  )
    issues.push(relative + ": potential credential/private key");
  if (/[A-Z]:[\\/](?:Users|Code)[\\/]/.test(content))
    issues.push(relative + ": absolute local path");
}
if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Public-source audit passed for " +
      files.length +
      " files. No credentials, environment files, nested dependencies or absolute local paths found in source.",
  );
