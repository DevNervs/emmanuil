import { build } from "esbuild";

await build({
  entryPoints: ["worker/pages.ts"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  outfile: "public/_worker.js",
  allowOverwrite: true,
  logLevel: "info",
});
