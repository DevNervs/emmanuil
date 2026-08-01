import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { mock } from "node:test";
import { handleAdminApi } from "../worker/adminApi.ts";
import { handleGroupRegistration } from "../worker/groupRegistration.ts";
import { cookie, signAdminSession } from "../worker/telegram.ts";
import { handleTelegramUpdate } from "../worker/telegramBot.ts";
import { handleYouTubeLive, resetYouTubeLiveCache } from "../worker/youtubeLive.ts";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

function memoryKv(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    async get(key, type) {
      const value = values.get(key);
      if (value === undefined) return null;
      if (type === "arrayBuffer") {
        return typeof value === "string" ? new TextEncoder().encode(value).buffer : value;
      }
      return value;
    },
    async put(key, value) {
      values.set(key, typeof value === "string" ? value : value);
    },
    async delete(key) {
      values.delete(key);
    },
    async list({ prefix = "" } = {}) {
      return {
        keys: [...values.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    values,
  };
}

test("renders every public route in Ukrainian", async () => {
  for (const pathname of ["/", "/visit", "/about", "/team", "/groups", "/online", "/contacts", "/europe", "/departments", "/donate", "/privacy", "/virovchennja"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /<html[^>]*lang="uk"/);
    assert.match(html, /Еммануїл/);
    assert.ok(html.includes(`<link rel="canonical" href="https://app.boris-reminder.workers.dev${pathname === "/" ? "" : `${pathname}/`}"/>`), `canonical ${pathname}`);
    assert.match(html, /property="og:image" content="https:\/\/app\.boris-reminder\.workers\.dev\/emmanuil-social-preview-20260729-v2\.jpg"/, `og:image ${pathname}`);
    assert.match(html, /name="twitter:image" content="https:\/\/app\.boris-reminder\.workers\.dev\/emmanuil-social-preview-20260729-v2\.jpg"/, `twitter:image ${pathname}`);
    assert.match(html, /rel="image_src" href="https:\/\/app\.boris-reminder\.workers\.dev\/emmanuil-social-preview-20260729-v2\.jpg"/, `image_src ${pathname}`);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
  }
});

test("ships brand, SEO and primary interactions", async () => {
  const home = await (await render("/")).text();
  assert.match(home, /video-hero/);
  assert.match(home, /data-stream-src="\/media\/hero-hls-grade3\/master\.m3u8"/);
  assert.match(home, /preload="auto"/);
  assert.match(home, /\/media\/hero-worship-loop\.mp4/);
  assert.doesNotMatch(home, /video-grain-overlay/);
  assert.doesNotMatch(home, /film-grain\.png/);
  assert.doesNotMatch(home, /<h1>Еммануїл<\/h1>/);
  assert.match(home, /hero-locations-grid/);
  assert.match(home, /google\.com\/maps\/dir\/\?api=1&amp;destination=48\.278415%2C25\.919215/);
  assert.match(home, /Прокласти маршрут у Google Maps/);
  assert.match(home, /м\. Сторожинець/);
  assert.match(home, /Існуємо, щоб ви дізналися про Бога більше/);
  assert.match(home, /hero-locations-bar/);
  assert.doesNotMatch(home, /Наші церкви та графік служінь/);
  assert.doesNotMatch(home, /hero-caption/);
  assert.match(home, /Християнська/);
  assert.match(home, /emmanuil-logo-brand\.png/);
  assert.match(home, /favicon-emmanuil-dark-32\.png/);
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /app\.boris-reminder\.workers\.dev\/emmanuil-social-preview-20260729-v2\.jpg/);
  assert.match(home, /property="og:image"/);
  assert.match(home, /og:image:type" content="image\/jpeg"/);
  assert.match(home, /Церква Еммануїл у Чернівцях, Україна \| Християнська євангельська церква/);
  assert.match(home, /Эммануил Черновцы/);
  assert.match(home, /Emmanuil Chernivtsi/);
  assert.match(home, /LocalBusiness/);
  assert.match(home, /WebSite/);
  assert.match(home, /href="\/visit\/"/);
  assert.match(home, /href="\/online\/"/);
  assert.match(home, /Найближчі служіння/);
  assert.match(home, /Актуальний сезон/);
  assert.match(home, /Домашні групи/);
  assert.doesNotMatch(home, /Сторінка онлайн/);
  assert.match(home, /Що очікувати/);
  assert.match(home, /Підтримати/);
  assert.match(home, /groups-carousel/);
  assert.doesNotMatch(home, /homegroup-gallery-\d{2}-(?:400|800)\.webp/);
  assert.match(home, /homegroup-gallery-01\.webp[^>]*loading="lazy"[^>]*fetchPriority="low"/);
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
  assert.match(groups, /\/media\/homegroups\/homegroup-gallery-01\.webp/);
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
  assert.match(interactionSource, /href="\/privacy\/"/);
  assert.match(interactionSource, /name="privacy-consent" required/);

  const privacy = await (await render("/privacy")).text();
  assert.match(privacy, /FormSubmit/);
  assert.match(privacy, /Telegram/);
  assert.match(privacy, /не продає дані/);

  const about = await (await render("/about")).text();
  assert.match(about, /\/media\/baptism-editorial-color\.webp/);
  assert.ok(about.includes('property="og:url" content="https://app.boris-reminder.workers.dev/about/"'), "about og:url");
  assert.match(about, /BreadcrumbList/);
  const online = await (await render("/online")).text();
  assert.ok(online.includes('property="og:url" content="https://app.boris-reminder.workers.dev/online/"'), "online og:url");
  assert.match(online, /Онлайн-служіння/);
  assert.match(online, /twitter:title" content="Онлайн-служіння Еммануїл"/);
  const teamPage = await (await render("/team")).text();
  assert.match(teamPage, /\/media\/team-ministry\.webp/);
  const europe = await (await render("/europe")).text();
  assert.match(europe, /Церкви в Європі/);
  assert.match(europe, /Брюссель/);
  assert.match(europe, /Амстердам/);
  assert.match(europe, /Гент/);
  const departments = await (await render("/departments")).text();
  assert.match(departments, /Департаменти/);
});

test("uses one social preview image on the protected admin route too", async () => {
  const admin = await (await render("/admin")).text();
  const preview = await readFile(
    new URL("../public/emmanuil-social-preview-20260729-v2.jpg", import.meta.url),
  );
  assert.ok(preview.length > 0);
  assert.match(admin, /property="og:image" content="https:\/\/app\.boris-reminder\.workers\.dev\/emmanuil-social-preview-20260729-v2\.jpg"/);
  assert.match(admin, /name="twitter:image" content="https:\/\/app\.boris-reminder\.workers\.dev\/emmanuil-social-preview-20260729-v2\.jpg"/);
});

test("ships every responsive home-group carousel image", async () => {
  for (let index = 1; index <= 15; index += 1) {
    const number = String(index).padStart(2, "0");
    for (const suffix of ["", "-800", "-400"]) {
      const imagePath = `../public/media/homegroups/homegroup-gallery-${number}${suffix}.webp`;
      const image = await readFile(new URL(imagePath, import.meta.url));
      assert.ok(image.length > 0, imagePath);
    }
  }
});

test("keeps the mobile group application scrollable and group-first", async () => {
  const groupSource = await readFile(new URL("../app/components/GroupsExplorer.tsx", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../app/components/SiteShell.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(shellSource, /document\.elementsFromPoint/);
  assert.match(shellSource, /sampleImage/);
  assert.match(shellSource, /sampleVideo/);
  assert.match(shellSource, /findDeclaredBrightness/);
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
  assert.match(styles, /\.live-dot \{[^}]*animation:live-pulse-red/);
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

test("keeps group editing and the promo section intentionally simple", async () => {
  const adminSource = await readFile(new URL("../app/components/AdminCMS.tsx", import.meta.url), "utf8");
  const mapSource = await readFile(new URL("../app/components/MapPicker.tsx", import.meta.url), "utf8");
  const promoSource = await readFile(new URL("../app/components/PromoSection.tsx", import.meta.url), "utf8");
  const configSource = await readFile(new URL("../app/components/SiteConfigEditor.tsx", import.meta.url), "utf8");
  const adminApiSource = await readFile(new URL("../worker/adminApi.ts", import.meta.url), "utf8");
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const prerenderSource = await readFile(new URL("../scripts/prerender.mjs", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(adminSource, /Адреса зустрічі/);
  assert.match(adminSource, /Місце на карті/);
  assert.match(adminSource, /Зберегти/);
  assert.match(adminSource, /Promise<boolean>/);
  assert.match(mapSource, /map-picker-marker__pin/);
  assert.match(mapSource, /disabled=\{!selectedCoordinates\}/);
  assert.match(mapSource, /Нічого не знайдено/);
  assert.doesNotMatch(mapSource, /const pinSvg|<svg/);
  assert.match(styles, /\.map-picker-marker__pin/);

  assert.match(promoSource, /aspect-\[4\/3\]/);
  assert.match(promoSource, /promo-ambient-video/);
  assert.match(promoSource, /object-contain/);
  assert.match(promoSource, /aria-hidden="true"/);
  assert.match(promoSource, /Math\.abs\(ambient\.currentTime - video\.currentTime\) > 0\.2/);
  assert.equal((promoSource.match(/<video/g) || []).length, 2);
  assert.doesNotMatch(promoSource, /buttonText|buttonHref|<a /);
  assert.doesNotMatch(configSource, /Текст кнопки|Посилання для кнопки|buttonText|buttonHref/);
  assert.doesNotMatch(configSource, /HLS|Fallback|Poster srcSet|Конфігурація сайту/);
  assert.match(configSource, /type="file"/);
  assert.match(configSource, /Обрати відеофайл/);
  assert.match(configSource, /Анонс показується на сайті/);
  assert.match(adminApiSource, /\/admin\/api\/promo-video/);
  assert.match(adminApiSource, /\/admin\/api\/dashboard/);
  assert.match(adminApiSource, /\/admin\/api\/admin-invites/);
  assert.match(adminApiSource, /\/admin\/api\/owner-invite/);
  assert.match(adminSource, /Додати адміна/);
  assert.match(adminSource, /Telegram username/);
  assert.match(adminSource, /Зробити власником/);
  assert.match(adminSource, /Власник/);
  assert.match(adminSource, /dashboard\?\.adminCount/);
  assert.doesNotMatch(adminSource, /Telegram ID користувача/);
  assert.doesNotMatch(adminSource, /Показувати групу на головній|На головній|toggleShow/);
  assert.doesNotMatch(pageSource, /HeroAnnouncement/);
  assert.match(pageSource, /HomeGroupCount/);
  assert.match(prerenderSource, /PRERENDER_PORT = 3011/);
  assert.match(prerenderSource, /NODE_ENV: "production"/);
  assert.match(prerenderSource, /Development assets leaked/);
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
  assert.match(publicSitemap, /<lastmod>2026-08-01<\/lastmod>/);
  assert.doesNotMatch(publicSitemap, /\/departments\/<\/loc>/);
  assert.equal((publicSitemap.match(/<url>/g) || []).length, 11);
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
    const response = await worker.fetch(new Request(`https://app.boris-reminder.workers.dev${oldPath}`), env, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 301, oldPath);
    assert.equal(response.headers.get("location"), `https://app.boris-reminder.workers.dev${newPath}`);
  }
});

test("adds security headers and upgrades insecure production requests", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("security-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const html = await worker.fetch(
    new Request("https://app.boris-reminder.workers.dev/", { headers: { accept: "text/html" } }),
    env,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(html.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(html.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(html.headers.get("X-Frame-Options"), "SAMEORIGIN");
  assert.match(html.headers.get("Strict-Transport-Security") || "", /max-age=63072000/);
  assert.match(html.headers.get("Cache-Control") || "", /s-maxage=3600/);

  const upgrade = await worker.fetch(
    new Request("http://app.boris-reminder.workers.dev/visit", { headers: { accept: "text/html" } }),
    env,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(upgrade.status, 301);
  assert.equal(upgrade.headers.get("location"), "https://app.boris-reminder.workers.dev/visit");
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
  assert.match(home, /Найближчі служіння/);
  assert.match(home, /hero-locations-grid/);
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

test("loads dashboard counters atomically and includes configured Telegram admins", async () => {
  const kv = memoryKv({
    "groups:current": JSON.stringify([{ id: 1 }, { id: 2 }]),
    "config:admins": JSON.stringify([222]),
    "app:0000000000001:a": JSON.stringify({
      id: "a", name: "A", phone: "1", groups: [], groupNames: [], createdAt: 1, seasonId: "s",
    }),
    "app:0000000000002:b": JSON.stringify({
      id: "b", name: "B", phone: "2", groups: [], groupNames: [], createdAt: 2, seasonId: "s", status: "done",
    }),
  });
  const token = await signAdminSession("password", "secret");
  const response = await handleAdminApi(
    new Request("https://example.com/admin/api/dashboard", {
      headers: { cookie: `admin-session=${token}` },
    }),
    {
      GROUP_APPLICATIONS: kv,
      ADMIN_PASSWORD: "password",
      ADMIN_SESSION_SECRET: "secret",
      TELEGRAM_ADMIN_CHAT_ID: "111",
      TELEGRAM_ADMIN_USER_IDS: "333, 222",
    },
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(
    {
      groupCount: data.groupCount,
      applicationCount: data.applicationCount,
      newApplicationCount: data.newApplicationCount,
      adminCount: data.adminCount,
    },
    { groupCount: 2, applicationCount: 2, newApplicationCount: 1, adminCount: 3 },
  );
});

test("shows every effective Telegram admin in the bot admin list", async () => {
  const kv = memoryKv({
    "config:admins": JSON.stringify([222]),
    "config:adminProfiles": JSON.stringify([
      { userId: 222, firstName: "Олена", username: "helen", addedAt: 1 },
    ]),
  });
  const messages = [];
  mock.method(globalThis, "fetch", async (_url, init) => {
    messages.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ ok: true }));
  });
  try {
    await handleTelegramUpdate(
      {
        update_id: 1,
        message: {
          message_id: 1,
          date: 1,
          text: "/admins",
          chat: { id: 111, type: "private" },
          from: { id: 111, is_bot: false, first_name: "Борис", username: "smuglyakov" },
        },
      },
      {
        GROUP_APPLICATIONS: kv,
        TELEGRAM_BOT_TOKEN: "bot-token",
        TELEGRAM_ADMIN_CHAT_ID: "111",
        TELEGRAM_ADMIN_USER_IDS: "333",
      },
    );
    assert.match(messages.at(-1).text, /<code>111<\/code>/);
    assert.match(messages.at(-1).text, /@helen — Олена/);
    assert.match(messages.at(-1).text, /<code>333<\/code>/);
    assert.doesNotMatch(messages.at(-1).text, /Адміністраторів не додано/);
  } finally {
    mock.restoreAll();
  }
});

test("expires the admin session cookie on logout", () => {
  assert.match(cookie("admin-session", "", { path: "/", maxAge: 0 }), /Max-Age=0/);
});

test("creates a one-time Telegram admin invite and accepts it through Start", async () => {
  const kv = memoryKv();
  const token = await signAdminSession("password", "secret");
  mock.method(globalThis, "fetch", async (url) => {
    if (String(url).endsWith("/getMe")) {
      return new Response(JSON.stringify({ ok: true, result: { username: "EmmanuilAdminBot" } }));
    }
    return new Response(JSON.stringify({ ok: true }));
  });
  try {
    const response = await handleAdminApi(
      new Request("https://example.com/admin/api/admin-invites", {
        method: "POST",
        headers: {
          cookie: `admin-session=${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ username: "@new_admin" }),
      }),
      {
        GROUP_APPLICATIONS: kv,
        ADMIN_PASSWORD: "password",
        ADMIN_SESSION_SECRET: "secret",
        TELEGRAM_BOT_TOKEN: "bot-token",
      },
    );
    assert.equal(response.status, 200);
    const invite = await response.json();
    assert.match(invite.link, /^https:\/\/t\.me\/EmmanuilAdminBot\?start=admin_[a-f0-9]{32}$/);
    const inviteToken = new URL(invite.link).searchParams.get("start").slice(6);

    await handleTelegramUpdate(
      {
        update_id: 1,
        message: {
          message_id: 1,
          date: 1,
          text: `/start admin_${inviteToken}`,
          chat: { id: 444, type: "private" },
          from: { id: 444, is_bot: false, first_name: "Нова", username: "new_admin" },
        },
      },
      { GROUP_APPLICATIONS: kv, TELEGRAM_BOT_TOKEN: "bot-token" },
    );

    assert.deepEqual(JSON.parse(await kv.get("config:admins")), [444]);
    assert.equal(await kv.get(`config:adminInvite:${inviteToken}`), null);
    const profiles = JSON.parse(await kv.get("config:adminProfiles"));
    assert.equal(profiles[0].username, "new_admin");
  } finally {
    mock.restoreAll();
  }
});

test("assigns the first Telegram owner once and prevents owner deletion", async () => {
  const kv = memoryKv();
  const session = await signAdminSession("password", "secret");
  mock.method(globalThis, "fetch", async (url) => {
    if (String(url).endsWith("/getMe")) {
      return new Response(JSON.stringify({ ok: true, result: { username: "EmmanuilAdminBot" } }));
    }
    return new Response(JSON.stringify({ ok: true }));
  });
  try {
    const response = await handleAdminApi(
      new Request("https://example.com/admin/api/owner-invite", {
        method: "POST",
        headers: { cookie: `admin-session=${session}`, "content-type": "application/json" },
        body: JSON.stringify({ username: "smuglyakov" }),
      }),
      {
        GROUP_APPLICATIONS: kv,
        ADMIN_PASSWORD: "password",
        ADMIN_SESSION_SECRET: "secret",
        TELEGRAM_BOT_TOKEN: "bot-token",
      },
    );
    assert.equal(response.status, 200);
    const invite = await response.json();
    const inviteToken = new URL(invite.link).searchParams.get("start").slice(6);

    await handleTelegramUpdate(
      {
        update_id: 2,
        message: {
          message_id: 2,
          date: 2,
          text: `/start admin_${inviteToken}`,
          chat: { id: 676227416, type: "private" },
          from: { id: 676227416, is_bot: false, first_name: "Boris", username: "smuglyakov" },
        },
      },
      { GROUP_APPLICATIONS: kv, TELEGRAM_BOT_TOKEN: "bot-token" },
    );

    const owner = JSON.parse(await kv.get("config:owner"));
    assert.equal(owner.username, "smuglyakov");
    assert.equal(owner.userId, 676227416);

    const deleteResponse = await handleAdminApi(
      new Request("https://example.com/admin/api/admins/676227416", {
        method: "DELETE",
        headers: { cookie: `admin-session=${session}` },
      }),
      {
        GROUP_APPLICATIONS: kv,
        ADMIN_PASSWORD: "password",
        ADMIN_SESSION_SECRET: "secret",
      },
    );
    assert.equal(deleteResponse.status, 409);
    assert.deepEqual(JSON.parse(await kv.get("config:admins")), [676227416]);

    const secondInvite = await handleAdminApi(
      new Request("https://example.com/admin/api/owner-invite", {
        method: "POST",
        headers: { cookie: `admin-session=${session}`, "content-type": "application/json" },
        body: JSON.stringify({ username: "someone_else" }),
      }),
      {
        GROUP_APPLICATIONS: kv,
        ADMIN_PASSWORD: "password",
        ADMIN_SESSION_SECRET: "secret",
        TELEGRAM_BOT_TOKEN: "bot-token",
      },
    );
    assert.equal(secondInvite.status, 409);
  } finally {
    mock.restoreAll();
  }
});

test("handles live and offline YouTube states via Data API", async () => {
  resetYouTubeLiveCache();
  mock.method(globalThis, "fetch", async (input) => {
    const url = String(input);
    if (url.includes("/search?")) {
      return new Response(JSON.stringify({ items: [{ id: { videoId: "liveVid1234" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/videos?")) {
      return new Response(JSON.stringify({
        items: [{ snippet: { liveBroadcastContent: "live" }, liveStreamingDetails: {} }],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  });
  const liveResponse = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.deepEqual(await liveResponse.json(), { live: true, videoId: "liveVid1234" });
  mock.restoreAll();

  resetYouTubeLiveCache();
  mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ items: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
  const offlineResponse = await handleYouTubeLive(new Request("http://localhost/api/youtube-live"));
  assert.deepEqual(await offlineResponse.json(), { live: false });
  mock.restoreAll();
});

test("does not report a YouTube outage as a confirmed offline broadcast", async () => {
  resetYouTubeLiveCache();
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
    body: JSON.stringify({ name: "Тестовий користувач", phone: "0669509977", groups: [0, 1, 2], startedAt: Date.now() - 5_000 }),
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
      body: JSON.stringify({ name: "Тест Мобільний", phone: "+380669509977", groups: [7, 8], startedAt: Date.now() - 5_000 }),
    });
    const response = await handleGroupRegistration(request, { TELEGRAM_BOT_TOKEN: "test-token", TELEGRAM_ADMIN_CHAT_ID: "test-chat" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: "Заявку надіслано. Адміністратор зв’яжеться з вами." });
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
