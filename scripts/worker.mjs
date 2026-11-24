import path from "node:path";
import { spawn } from "node:child_process";
import { root } from "./paths.mjs";
import { verifyBuild } from "./verify-build.mjs";
await verifyBuild();
const mode = process.argv[2],
  args =
    mode === "dev"
      ? ["dev", "--local", "--ip", "127.0.0.1", "--port", "8787"]
      : mode === "dry-run"
        ? ["deploy", "--dry-run", "--outdir", ".wrangler/dry-run"]
        : mode === "deploy"
          ? ["deploy"]
          : null;
if (!args) throw Error("Use dev, dry-run or deploy");
const child = spawn(
  process.execPath,
  [path.join(root, "node_modules/wrangler/bin/wrangler.js"), ...args],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => child.kill(signal));
