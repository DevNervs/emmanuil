import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { mock } from "node:test";
import { handleGroupRegistration } from "../worker/groupRegistration.ts";
import { extractLiveVideoId, handleYouTubeLive } from "../worker/youtubeLive.ts";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders every public route in Ukrainian", async () => {
  for (const pathname of ["/", "/visit", "/about", "/team", "/groups", "/online", "/contacts", "/europe", "/departments", "/donate", "/privacy", "/virovchennja"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /<html lang="uk">/);
    assert.match(html, /Еммануїл/);
    assert.ok(html.includes(`<link rel="canonical" href="https://emmanuil.pages.dev${pathname === "/" ? "" : `${pathname}/`}"/>`), `canonical ${pathname}`);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
  }
});

test("ships brand, SEO and primary interactions", async () => {
  const home = await (await render("/")).text();
  assert.match(home, /video-hero/);
  assert.match(home, /\/media\/hero-worship-loop\.mp4/);
  assert.doesNotMatch(home, /<h1>Еммануїл<\/h1>/);
  assert.match(home, /Щонеділі о 10:00 та 17:00 · 4 локації/);
  assert.match(home, /Існуємо, щоб ви дізналися про Бога більше/);
  assert.match(home, /home-now-locations/);
  assert.doesNotMatch(home, /Наші церкви та графік служінь/);
  assert.doesNotMatch(home, /hero-caption/);
  assert.match(home, /Християнська/);
  assert.match(home, /emmanuil-logo-brand\.png/);
  assert.match(home, /favicon-emmanuil-dark-32\.png/);
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /emmanuil\.pages\.dev\/share-card\.jpg/);
  assert.match(home, /property="og:image"/);
  assert.match(home, /og:image:type" content="image\/jpeg"/);
  assert.match(home, /Церква Еммануїл у Чернівцях \| Християнська євангельська церква/);
  assert.match(home, /Эммануил Черновцы/);
  assert.match(home, /Emmanuil Chernivtsi/);
  assert.match(home, /LocalBusiness/);
  assert.match(home, /WebSite/);
  assert.match(home, /href="\/visit"/);
  assert.match(home, /href="\/online"/);
  assert.match(home, /Найближче служіння/);
  assert.match(home, /Актуальний сезон/);
  assert.match(home, /Домашні групи/);
  assert.doesNotMatch(home, /Сторінка онлайн/);
  assert.match(home, /Що очікувати/);
  assert.match(home, /Підтримати/);
  assert.match(home, /groups-carousel/);
  assert.doesNotMatch(home, /Архів подій/);
  assert.doesNotMatch(home, /href="\/news"/);
  assert.doesNotMatch(home, /Зробіть перший крок спокійно/);
  assert.doesNotMatch(home, /З життя церкви · Архів/);
  assert.doesNotMatch(home, /Локації та час/);
  assert.doesNotMatch(home, /Групи та онлайн/);

  const visit = await (await render("/visit")).text();
  assert.match(visit, /Будемо раді познайомитися/);
  assert.doesNotMatch(visit, /Спокійний перший крок/);
  assert.match(visit, /\/media\/visit-worship\.webp/);
  assert.doesNotMatch(visit, /\/media\/childrens\.webp/);
  assert.match(visit, /Ваш перший візит/);
  assert.match(visit, /за кавою, чаєм і частуваннями/);
  assert.match(visit, /Практичний FAQ/);
  assert.match(visit, /Скільки триває служба/);
  assert.match(visit, /Чи є дитяче служіння/);
  assert.match(visit, /Де паркуватися/);
  assert.match(visit, /Який дресс-код/);
  assert.match(visit, /Чи доступне приміщення/);
  assert.match(visit, /Що, якщо я вперше/);
  assert.match(visit, /Локації та контакти/);
  assert.doesNotMatch(visit, /visit-location-grid/);

  const groups = await (await render("/groups")).text();
  assert.match(groups, /\/media\/homegroup-how\.webp/);
  assert.match(groups, /Назва, ведучий або адреса/);
  assert.match(groups, /48\.2863973,25\.9391673/);

  const contacts = await (await render("/contacts")).text();
  assert.match(contacts, /\/media\/contacts-worship-hall\.webp/);
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

  const about = await (await render("/about")).text();
  assert.match(about, /\/media\/baptism-editorial-color\.webp/);
  assert.ok(about.includes('property="og:url" content="https://emmanuil.pages.dev/about/"'), "about og:url");
  assert.match(about, /BreadcrumbList/);
  const online = await (await render("/online")).text();
  assert.ok(online.includes('property="og:url" content="https://emmanuil.pages.dev/online/"'), "online og:url");
  assert.match(online, /Онлайн-служіння/);
  assert.match(online, /twitter:title" content="Онлайн-служіння Еммануїл"/);
  const teamPage = await (await render("/team")).text();
  assert.match(teamPage, /\/media\/team-ministry\.webp/);
  const europe = await (await render("/europe")).text();
  assert.match(europe, /Розділ в розробці/);
  const departments = await (await render("/departments")).text();
  assert.match(departments, /Департаменти/);
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
  assert.doesNotMatch(styles, /animation:group-cta-attention/);
  assert.doesNotMatch(styles, /@keyframes group-cta-attention/);
  assert.doesNotMatch(styles, /animation:group-cta-pulse/);
  assert.doesNotMatch(styles, /@keyframes hero-drift/);
  assert.doesNotMatch(styles, /@keyframes group-cta-glow/);
  assert.match(styles, /@property --cta-angle/);
  assert.match(styles, /@keyframes group-cta-spin/);
  assert.match(styles, /@keyframes group-cta-breathe/);
  assert.match(styles, /@keyframes group-cta-sheen/);
  assert.match(styles, /animation:group-cta-spin 2\.8s/);
  assert.match(styles, /conic-gradient\(from var\(--cta-angle\)/);
  assert.match(styles, /--photo-filter:/);
  assert.match(styles, /\.video-hero \{[^}]*min-height:min\(85svh/);
  assert.match(styles, /\.groups-carousel/);
  assert.match(styles, /\.live-indicator i \{[^}]*animation:live-pulse/);
  assert.doesNotMatch(styles, /\.video-placeholder-mark/);
  assert.match(styles, /\.video-hero \.hero-slogan \{[^}]*animation:rise/);
  assert.match(styles, /\.video-hero-media video \{[^}]*brightness\(\.7/);
  assert.doesNotMatch(styles, /\.donate-link:hover,\.button:hover \{[^}]*transform:translateY/);
  assert.doesNotMatch(groupSource, /5 травня/);
  assert.match(groupSource, /chosenGroups\.length >= 2/);
  assert.match(groupSource, /type="button" role="checkbox" aria-checked=\{checked\}/);
  assert.match(styles, /\.group-form-groups button \{[^}]*width:100%;/);
  assert.match(styles, /\.home-online-section \.video-placeholder \{[^}]*min-height:32rem; aspect-ratio:auto;/);
});

test("uses centralized typed content and stable sitemap dates", async () => {
  const groups = await readFile(new URL("../app/data/groups.ts", import.meta.url), "utf8");
  const site = await readFile(new URL("../app/data/site.ts", import.meta.url), "utf8");
  const news = await readFile(new URL("../app/data/news.ts", import.meta.url), "utf8");
  const faq = await readFile(new URL("../app/data/faq.ts", import.meta.url), "utf8");
  const seo = await readFile(new URL("../app/seo.ts", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const publicSitemap = await (await render('/sitemap.xml')).text();
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(groups, /export type Group =/);
  assert.match(site, /DEFAULT_SITE_ORIGIN/);
  assert.match(site, /NEXT_PUBLIC_SITE_URL/);
  assert.match(news, /status: "archived"/);
  assert.match(news, /publishedAt:/);
  assert.match(faq, /export const visitFaq/);
  assert.match(seo, /OpeningHoursSpecification/);
  assert.match(seo, /PlaceOfWorship/);
  assert.match(seo, /buildFaqPageSchema/);
  assert.match(seo, /seoKeywords/);
  assert.match(sitemap, /buildSitemapEntries/);
  assert.doesNotMatch(sitemap, /new Date\(/);
  assert.match(publicSitemap, /\/visit\/<\/loc>/);
  assert.match(publicSitemap, /\/privacy\/<\/loc>/);
  assert.match(publicSitemap, /\/virovchennja\/<\/loc>/);
  assert.match(publicSitemap, /<lastmod>2026-07-28<\/lastmod>/);
  assert.equal((publicSitemap.match(/<url>/g) || []).length, 12);
  assert.match(seo, /pageMetadata/);
  assert.match(seo, /buildBreadcrumbList/);
  assert.match(seo, /"Church"/);
  assert.match(seo, /PlaceOfWorship/);
  assert.match(seo, /LocalBusiness/);
  assert.match(seo, /"WebSite"/);
  assert.match(layout, /buildSiteGraph/);
  assert.match(layout, /metadataBase: new URL\(site\.canonicalUrl\)/);
});

test("ships FAQ rich results on visit page", async () => {
  const visit = await (await render("/visit")).text();
  assert.match(visit, /FAQPage/);
  assert.match(visit, /Скільки триває служба/);
  assert.match(visit, /acceptedAnswer/);
});

test("preserves authority from indexed legacy URLs with permanent redirects", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("redirect-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  for (const [oldPath, newPath] of [["/about-us/team", "/team"], ["/about-us/mi-virimo", "/about#beliefs"], ["/about-us/virovchennja-chve", "/virovchennja"], ["/live", "/online"]]) {
    const response = await worker.fetch(new Request(`https://emmanuil.pages.dev${oldPath}`), env, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 301, oldPath);
    assert.equal(response.headers.get("location"), `https://emmanuil.pages.dev${newPath}`);
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

test("surfaces the next service and keeps all locations on contacts", async () => {
  const home = await (await render("/")).text();
  const contacts = await (await render("/contacts")).text();
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const service = await readFile(new URL("../app/data/service.ts", import.meta.url), "utf8");
  const locations = await readFile(new URL("../app/data/locations.ts", import.meta.url), "utf8");
  assert.match(home, /Найближче служіння/);
  assert.match(home, /home-now/);
  assert.match(home, /home-now-locations/);
  assert.doesNotMatch(home, /home-churches/);
  assert.doesNotMatch(home, /home-now-grid/);
  assert.doesNotMatch(home, /Адреси церков — у блоці локацій нижче/);
  assert.doesNotMatch(home, /Наші церкви та графік служінь/);
  assert.doesNotMatch(home, /footer-service-section|footer-locations/);
  for (const expected of ["Криворучка", "Кобилянська", "Садгора", "Сторожинець"]) {
    assert.match(home, new RegExp(expected));
    assert.match(contacts, new RegExp(expected));
  }
  assert.match(locations, /label: "Криворучка"[^\n]+time: "Щонеділі о 10:00"/);
  assert.match(locations, /label: "Кобилянська"[^\n]+time: "Щонеділі о 17:00"/);
  assert.match(locations, /label: "Садгора"[^\n]+time: "Щонеділі о 10:00"/);
  assert.match(locations, /label: "Сторожинець"[^\n]+time: "Щонеділі о 10:00"/);
  assert.match(service, /export function getNextService/);
  assert.match(styles, /\.home-now-actions/);
  assert.match(styles, /\.home-now-locations/);
  assert.doesNotMatch(styles, /\.home-now-grid/);
  assert.doesNotMatch(styles, /\.home-churches\b/);
  assert.match(styles, /\.home-season/);
  assert.match(styles, /\.home-live/);
});

test("handles live and offline YouTube states without network access", async () => {
  mock.method(globalThis, "fetch", async () => new Response('<link rel="canonical" href="https://www.youtube.com/watch?v=liveVid1234"><script>{"isLiveNow":true}</script>'));
  const liveResponse = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.deepEqual(await liveResponse.json(), { live: true, videoId: "liveVid1234" });
  mock.restoreAll();

  mock.method(globalThis, "fetch", async () => new Response('<link rel="canonical" href="https://www.youtube.com/watch?v=recorded123"><script>{"isLiveNow":false}</script>'));
  const offlineResponse = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.deepEqual(await offlineResponse.json(), { live: false });
  mock.restoreAll();
});

test("finds a live broadcast when YouTube keeps the channel canonical URL", () => {
  const channelHtml = '<link rel="canonical" href="https://www.youtube.com/channel/UCxFwu9_CAk23NIVW3Y7emsQ"><script>{"videoRenderer":{"videoId":"BRxxF_SS6Rc","badges":[{"metadataBadgeRenderer":{"style":"BADGE_STYLE_TYPE_LIVE_NOW"}}]}}</script>';
  assert.equal(extractLiveVideoId(channelHtml, "https://www.youtube.com/@EmmanuilCV/streams"), "BRxxF_SS6Rc");
});

test("does not report a YouTube outage as an offline broadcast", async () => {
  mock.method(globalThis, "fetch", async () => new Response("rate limited", { status: 429 }));
  const response = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { live: false, available: false });
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
