import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders every public route in Ukrainian", async () => {
  for (const pathname of ["/", "/news", "/about", "/team", "/groups", "/online", "/contacts", "/donate"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, /<html lang="uk">/);
    assert.match(html, /Еммануїл/);
    assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
  }
});

test("ships brand, SEO and primary interactions", async () => {
  const home = await (await render("/")).text();
  assert.match(home, /Християнська/);
  assert.match(home, /emmanuil-logo-hq\.png/);
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /emmanuil\.pages\.dev\/og-editorial\.png/);

  const groups = await (await render("/groups")).text();
  assert.match(groups, /Назва, ведучий або адреса/);
  assert.match(groups, /48\.2864175,25\.9394979/);

  const contacts = await (await render("/contacts")).text();
  assert.match(contacts, /Контактна форма/);
  assert.match(contacts, /Ореста Криворучка, 57/);
  assert.match(contacts, /Васіле Александрі, 8/);
  assert.match(contacts, /Українська, 5, Сторожинець/);
  assert.match(contacts, /Прокласти маршрут/);
  const interactionSource = await readFile(new URL("../app/components/InteractionTools.tsx", import.meta.url), "utf8");
  assert.match(interactionSource, /formsubmit\.co\/ajax/);
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
    assert.match(html, /Останні новини/);
    assert.match(html, /Усі новини/);
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
