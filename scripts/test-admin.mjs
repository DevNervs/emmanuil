import { chromium } from "playwright-core";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const logs = [];
page.on("console", (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`PAGEERROR: ${err.message}`));
page.on("requestfailed", (req) => logs.push(`REQUESTFAILED: ${req.url()} ${req.failure()?.errorText ?? ""}`));

try {
  await page.goto("https://emmanuil.pages.dev/admin", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  const title = await page.title();
  await page.screenshot({ path: "/tmp/emmanuil-admin.png", fullPage: true });
  console.log(`Title: ${title}`);
  console.log(`URL: ${page.url()}`);
  console.log(`--- Console logs ---`);
  console.log(logs.join("\n") || "No logs");
} catch (err) {
  console.log("Navigation error:", err.message);
  console.log("--- Console logs ---");
  console.log(logs.join("\n") || "No logs");
} finally {
  await browser.close();
}
