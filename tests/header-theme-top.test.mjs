import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import test from "node:test";

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/contacts",
  "/departments",
  "/donate",
  "/europe",
  "/groups",
  "/online",
  "/privacy",
  "/team",
  "/virovchennja",
  "/visit",
];

async function waitForPort(port, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok || res.status === 404) return;
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Server on port ${port} did not start in time`);
}

async function withServer(fn) {
  const server = spawn("npm", ["run", "start"], {
    cwd: process.cwd(),
    stdio: "pipe",
    detached: true,
  });

  try {
    await waitForPort(3000);
    await fn();
  } finally {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      // already gone
    }
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        try {
          process.kill(-server.pid, "SIGKILL");
        } catch {}
        resolve();
      }, 2000);
      server.on("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

test("header theme at scrollY=0 matches first #main-content [data-header-theme]", { timeout: 120000 }, async () => {
  await withServer(async () => {
    const browser = await chromium.launch({
      headless: true,
      channel: "chrome",
    });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

      for (const pathname of PUBLIC_PATHS) {
        await page.goto(`http://localhost:3000${pathname}`);
        await page.waitForTimeout(1000);

        const { scrollY, theme, firstSection } = await page.evaluate(() => {
          const section = document.querySelector("#main-content [data-header-theme]");
          return {
            scrollY: window.scrollY,
            theme: document.documentElement.getAttribute("data-header-theme"),
            firstSection: section ? section.getAttribute("data-header-theme") : "none",
          };
        });

        const expected = firstSection === "dark" ? "dark" : firstSection === "light" ? "light" : "dark";
        assert.equal(scrollY, 0, `scrollY should be 0 for ${pathname}`);
        assert.equal(theme, expected, `header theme should match first section for ${pathname}`);
      }
    } finally {
      await browser.close();
    }
  });
});
