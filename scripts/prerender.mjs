import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const PRERENDER_PORT = 3011;
const PRERENDER_ORIGIN = `http://localhost:${PRERENDER_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(pathname) {
  const url = `${PRERENDER_ORIGIN}${pathname}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function waitForServer(child) {
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Production server exited with code ${child.exitCode}`);
    }
    try {
      const res = await fetch(PRERENDER_ORIGIN);
      if (res.status === 200) return;
    } catch {
      // Server is still starting.
    }
    await sleep(500);
  }
  throw new Error(`Production server did not respond on ${PRERENDER_ORIGIN}`);
}

function killProcessGroup(child) {
  try {
    if (child?.pid) process.kill(-child.pid, "SIGTERM");
  } catch {
    // Process already stopped.
  }
}

async function main() {
  const root = process.cwd();
  const out = join(root, "dist/pages");

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(join(root, "dist/client"), out, { recursive: true });

  const server = spawn("npm", ["run", "start"], {
    stdio: "pipe",
    detached: true,
    env: { ...process.env, NODE_ENV: "production", PORT: String(PRERENDER_PORT) },
  });
  server.stdout.on("data", (data) => process.stdout.write(data));
  server.stderr.on("data", (data) => process.stderr.write(data));

  try {
    await waitForServer(server);

    const sitemap = await fetchText("/sitemap.xml");
    await writeFile(join(out, "sitemap.xml"), sitemap);
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1]);
    if (!locs.some((loc) => new URL(loc).pathname === "/admin")) {
      locs.push(`${PRERENDER_ORIGIN}/admin`);
    }
    locs.push(`${PRERENDER_ORIGIN}/404`);

    await writeFile(join(out, "robots.txt"), await fetchText("/robots.txt"));

    const prerendered = [];
    for (const loc of locs) {
      let pathname;
      try {
        pathname = new URL(loc).pathname;
      } catch {
        continue;
      }
      const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
      if (lastSegment.includes(".")) continue;

      const normalized = pathname.replace(/\/$/, "") || "/";
      const targetDir = normalized === "/" ? out : join(out, normalized);
      const targetFile = join(targetDir, "index.html");
      const html = await fetchText(pathname);

      if (html.includes("/app/globals.css") || html.includes("virtual:vite-rsc")) {
        throw new Error(`Development assets leaked into prerendered route ${pathname}`);
      }

      await mkdir(dirname(targetFile), { recursive: true });
      await writeFile(targetFile, html);
      prerendered.push(pathname);
    }

    console.log(`Prerendered ${prerendered.length} production routes.`);
  } finally {
    killProcessGroup(server);
    await sleep(500);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
