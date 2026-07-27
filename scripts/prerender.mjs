import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function runBuild() {
  const build = spawn("npm", ["run", "build"], { stdio: "inherit" });
  return new Promise((resolve, reject) => {
    build.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`build exited with code ${code}`))
    );
    build.on("error", reject);
  });
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch("http://localhost:3000/");
      if (res.status === 200) return true;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  return false;
}

function killProcessGroup(child) {
  try {
    if (child && child.pid) process.kill(-child.pid, "SIGTERM");
  } catch {
    // already gone
  }
}

async function main() {
  const root = process.cwd();
  const out = join(root, "dist/pages");

  await runBuild();

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(join(root, "dist/client"), out, { recursive: true });

  const server = spawn("npm", ["run", "start"], {
    stdio: "pipe",
    detached: true,
  });
  server.stdout.on("data", (d) => process.stdout.write(d));
  server.stderr.on("data", (d) => process.stderr.write(d));

  try {
    const ready = await waitForServer();
    if (!ready) throw new Error("Local server did not respond on http://localhost:3000/");

    const sitemap = await fetchText("http://localhost:3000/sitemap.xml");
    await writeFile(join(out, "sitemap.xml"), sitemap);
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]);

    const robots = await fetchText("http://localhost:3000/robots.txt");
    await writeFile(join(out, "robots.txt"), robots);

    const prerendered = [];
    for (const loc of locs) {
      let pathname;
      try {
        pathname = new URL(loc).pathname;
      } catch {
        continue;
      }
      const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
      if (lastSegment.includes(".")) continue; // skip static files

      const normalized = pathname.replace(/\/$/, "") || "/";
      const targetDir = normalized === "/" ? out : join(out, normalized);
      const targetFile = join(targetDir, "index.html");
      const html = await fetchText(`http://localhost:3000${pathname}`);
      await mkdir(dirname(targetFile), { recursive: true });
      await writeFile(targetFile, html);
      prerendered.push(pathname);
    }

    console.log(`Prerendered ${prerendered.length} routes:`);
    for (const p of prerendered) console.log(`  - ${p}`);
  } finally {
    killProcessGroup(server);
    await sleep(500);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
