import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { mock } from "node:test";
import { handleGroupRegistration } from "../worker/groupRegistration.ts";
import { handleYouTubeLive } from "../worker/youtubeLive.ts";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders every public route in Ukrainian", async () => {
  for (const pathname of ["/", "/visit", "/news", "/about", "/team", "/groups", "/online", "/contacts", "/donate", "/privacy"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /<html lang="uk">/);
    assert.match(html, /Еммануїл/);
    assert.ok(html.includes(`<link rel="canonical" href="https://emmanuil.cv.ua${pathname === "/" ? "/" : pathname}"/>`), `canonical ${pathname}`);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
  }
});

test("ships brand, SEO and primary interactions", async () => {
  const home = await (await render("/")).text();
  assert.match(home, /Християнська/);
  assert.match(home, /emmanuil-logo-hq\.png/);
  assert.match(home, /favicon-emmanuil-dark-32\.png/);
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /emmanuil\.cv\.ua\/og-editorial\.png/);
  assert.match(home, /Церква Еммануїл у Чернівцях \| Християнська церква/);
  assert.match(home, /Эммануил Черновцы/);
  assert.match(home, /Emmanuil Chernivtsi/);
  assert.match(home, /LocalBusiness/);
  assert.match(home, /WebSite/);
  assert.match(home, /href="\/visit"/);
  assert.match(home, /href="\/online"/);
  assert.match(home, /З життя церкви · Архів/);
  assert.match(home, /Подія завершена/);

  const visit = await (await render("/visit")).text();
  assert.match(visit, /Ваш перший візит/);
  assert.match(visit, /Інформація про паркування, дитяче служіння та доступність/);
  assert.match(visit, /Прокласти маршрут/);

  const groups = await (await render("/groups")).text();
  assert.match(groups, /Назва, ведучий або адреса/);
  assert.match(groups, /48\.2864175,25\.9394979/);

  const contacts = await (await render("/contacts")).text();
  assert.match(contacts, /Контактна форма/);
  assert.match(contacts, /Ореста Криворучка, 57/);
  assert.match(contacts, /Васіле Александрі, 8/);
  assert.match(contacts, /Сторожинець, вул\. Українська, 5/);
  assert.match(contacts, /Прокласти маршрут/);
  const interactionSource = await readFile(new URL("../app/components/InteractionTools.tsx", import.meta.url), "utf8");
  assert.match(interactionSource, /formsubmit\.co\/ajax/);
  assert.match(interactionSource, /href="\/privacy"/);
  assert.match(interactionSource, /name="privacy-consent" required/);

  const privacy = await (await render("/privacy")).text();
  assert.match(privacy, /FormSubmit/);
  assert.match(privacy, /Telegram/);
  assert.match(privacy, /не продає дані/);
});

test("keeps the mobile group application scrollable and group-first", async () => {
  const groupSource = await readFile(new URL("../app/components/GroupsExplorer.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.ok(groupSource.indexOf('className="group-form-groups"') < groupSource.indexOf('className="group-form-contact-fields"'));
  assert.match(groupSource, /group\.address \|\| "Адресу уточнюйте у ведучого"/);
  assert.match(styles, /height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;/);
  assert.match(styles, /height:min\(880px,92vh\); max-height:min\(880px,92vh\)/);
  assert.match(styles, /touch-action:pan-y/);
  assert.doesNotMatch(styles, /group-form-groups > div \{[^}]*max-height:21rem/);
  assert.match(styles, /animation:group-cta-attention 3\.15s/);
  assert.match(styles, /@keyframes group-cta-attention/);
  assert.doesNotMatch(groupSource, /5 травня/);
  assert.match(groupSource, /chosenGroups\.length >= 2/);
  assert.match(groupSource, /type="button" role="checkbox" aria-checked=\{checked\}/);
  assert.match(styles, /\.group-form-groups button \{[^}]*width:100%;/);
  assert.match(styles, /\.home-online-section \.video-placeholder \{[^}]*min-height:32rem; aspect-ratio:auto;/);
});

test("renders every news item as an internal article", async () => {
  const slugs = ["noti-vdyachnosti", "spravzhnya-lyubov", "reestratsiya-na-sezon-domashnikh-grup-27-01-30-03-rozpochato", "osoblivij-den-podyaki-20-zhovtnya-2024", "vsia-zemlia-spivai-osanna", "vodne-khreshchennya-2024-v-tserkvi-emmanuil", "svyato-dlya-ditej-z-bagatoditnikh-simej-ta-sirit", "nadiia-dlia-sim-i", "domashni-hrupy-iak-tse"];
  const listing = await (await render("/news")).text();
  assert.doesNotMatch(listing, /href="https:\/\/emmanuil\.cv\.ua\/news\//);
  for (const slug of slugs) {
    assert.match(listing, new RegExp(`href="/news/${slug}"`));
    const response = await render(`/news/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    assert.match(html, /Подія завершена/);
    assert.match(html, /З архіву/);
    assert.match(html, /Увесь архів/);
    assert.match(html, /BreadcrumbList/);
    assert.match(html, /Article/);
    assert.ok(html.includes(`<link rel="canonical" href="https://emmanuil.cv.ua/news/${slug}"/>`), `canonical ${slug}`);
  }
});

test("uses centralized typed content and stable sitemap dates", async () => {
  const content = await readFile(new URL("../app/content.ts", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const publicSitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(content, /export type Group =/);
  assert.match(content, /status: "archived"/);
  assert.match(content, /publishedAt:/);
  assert.match(sitemap, /item\.publishedAt/);
  assert.doesNotMatch(sitemap, /new Date\(/);
  assert.match(publicSitemap, /\/visit<\/loc>/);
  assert.match(publicSitemap, /\/privacy<\/loc>/);
  assert.match(publicSitemap, /<lastmod>2025-10-05<\/lastmod>/);
  assert.equal((publicSitemap.match(/<url>/g) || []).length, 19);
  assert.match(layout, /"Church"/);
  assert.match(layout, /"LocalBusiness"/);
  assert.match(layout, /"@type": "WebSite"/);
  assert.doesNotMatch(layout, /emmanuil\.pages\.dev/);
});

test("preserves authority from indexed legacy URLs with permanent redirects", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("redirect-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  for (const [oldPath, newPath] of [["/about-us/team", "/team"], ["/about-us/mi-virimo", "/about#beliefs"], ["/live", "/online"], ["/departments", "/about"]]) {
    const response = await worker.fetch(new Request(`https://emmanuil.cv.ua${oldPath}`), env, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 301, oldPath);
    assert.equal(response.headers.get("location"), `https://emmanuil.cv.ua${newPath}`);
  }
});

test("renders the manuscript without decorative verse stars or a baked white backdrop", async () => {
  const about = await (await render("/about")).text();
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(about, /✦/);
  assert.match(styles, /beliefs-scroll-transparent\.png/);
});

test("aligns donation account actions along the bottom edge", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.account-grid article \{[^}]*display:flex;[^}]*height:100%;[^}]*flex-direction:column;/);
  assert.match(styles, /\.account-grid \.copy-button \{[^}]*margin-top:auto;/);
});

test("renders four consistently timed service locations on the home page and footer", async () => {
  const home = await (await render("/")).text();
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const content = await readFile(new URL("../app/content.ts", import.meta.url), "utf8");
  assert.ok((home.match(/Локації служінь/g) || []).length >= 2);
  for (const expected of ["Криворучка", "Кобилянська", "Садгора", "Сторожинець"]) assert.match(home, new RegExp(expected, "g"));
  assert.match(content, /label: "Криворучка"[^\n]+time: "Щонеділі о 10:00"/);
  assert.match(content, /label: "Кобилянська"[^\n]+time: "Щонеділі о 17:00"/);
  assert.match(content, /label: "Садгора"[^\n]+time: "Щонеділі о 10:00"/);
  assert.match(content, /label: "Сторожинець"[^\n]+time: "Щонеділі о 10:00"/);
  assert.match(styles, /\.home-visit-grid \{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.footer-locations \{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test("handles live and offline YouTube states without network access", async () => {
  mock.method(globalThis, "fetch", async () => new Response('<link rel="canonical" href="https://www.youtube.com/watch?v=liveVideo123"><script>{"isLiveNow":true}</script>'));
  const liveResponse = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.deepEqual(await liveResponse.json(), { live: true, videoId: "liveVideo123" });
  mock.restoreAll();

  mock.method(globalThis, "fetch", async () => new Response('<link rel="canonical" href="https://www.youtube.com/watch?v=recorded123"><script>{"isLiveNow":false}</script>'));
  const offlineResponse = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.deepEqual(await offlineResponse.json(), { live: false });
  mock.restoreAll();
});

test("rejects more than two selected groups without sending a real request", async () => {
  const request = new Request("http://localhost/api/group-registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Тестовий користувач", telegram: "@test", groups: [0, 1, 2], startedAt: Date.now() - 5_000 }),
  });
  const response = await handleGroupRegistration(request, {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: "Оберіть одну або дві домашні групи." });
});

test("sends a valid group application through a mocked Telegram request", async () => {
  let telegramRequest;
  mock.method(globalThis, "fetch", async (url, init) => {
    telegramRequest = { url: String(url), init };
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  try {
    const request = new Request("http://localhost/api/group-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Тест Мобільний", telegram: "@mobile_test", groups: [7, 8], startedAt: Date.now() - 5_000 }),
    });
    const response = await handleGroupRegistration(request, { TELEGRAM_BOT_TOKEN: "test-token", TELEGRAM_ADMIN_CHAT_ID: "test-chat" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: "Заявку надіслано. Адміністратор зв’яжеться з вами у Telegram." });
    assert.equal(telegramRequest.url, "https://api.telegram.org/bottest-token/sendMessage");
    const payload = JSON.parse(telegramRequest.init.body);
    assert.equal(payload.chat_id, "test-chat");
    assert.match(payload.text, /Тест Мобільний/);
    assert.match(payload.text, /№8\. Садгора\. Шлях до Батька/);
    assert.match(payload.text, /№9\. Садгора\. Молодіжна група/);
  } finally {
    mock.restoreAll();
  }
});
