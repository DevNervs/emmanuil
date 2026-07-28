const groupNames = [
  "№1. Духовний ріст — Клодницький Віталій",
  "№2. Духовний ріст — Григорчук Олександр, Маковей Богдан",
  "№3. Духовний ріст — Маковій Михайло, Нікіфорець Валерій",
  "№4. Духовний ріст — Сємєшкін Єгор",
  "№5. Духовний ріст — Данильченко Богдан",
  "№6. НЕІНСТАГРАМНА — група для дівчат",
  "№7. Послання до Євреїв — група для нечуючих",
  "№8. Садгора. Шлях до Батька",
  "№9. Садгора. Молодіжна група",
  "№10. Садгора. Розбір Біблії",
  "№11. Сторожинець — 1 Послання до Коринтян",
  "№12. Молодіжна група — книга Обʼявлення",
  "№13. Молодіжна група — 1 Послання до Коринтян",
  "№14. Молодіжна група. Духовний ріст",
  "№15. Молодіжна домашня група",
];
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const youtubeLiveUrl = "https://www.youtube.com/@EmmanuilCV/live";
const legacyRedirects = {
  "/about-us": "/about",
  "/about-us/team": "/team",
  "/about-us/mi-virimo": "/about#beliefs",
  "/about-us/virovchennja-chve": "/virovchennja",

  "/live": "/online",
};

async function register(request, env) {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if (Number(request.headers.get("content-length") || 0) > 12000) return json({ message: "Завеликий запит." }, 413);
  let body;
  try { body = await request.json(); } catch { return json({ message: "Некоректні дані анкети." }, 400); }
  if (body.website) return json({ message: "Заявку прийнято." });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const telegram = typeof body.telegram === "string" ? body.telegram.trim() : "";
  const groups = Array.isArray(body.groups) ? [...new Set(body.groups.filter((item) => Number.isInteger(item) && item >= 0 && item < groupNames.length))] : [];
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (Date.now() - startedAt < 1500 || Date.now() - startedAt > 86400000) return json({ message: "Оновіть сторінку та заповніть анкету ще раз." }, 400);
  if (name.length < 2 || name.length > 100) return json({ message: "Вкажіть, будь ласка, прізвище та ім’я." }, 400);
  if (telegram.length < 3 || telegram.length > 80) return json({ message: "Вкажіть нік або номер телефону в Telegram." }, 400);
  if (!groups.length || groups.length > 2) return json({ message: "Оберіть одну або дві домашні групи." }, 400);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) return json({ message: "Надсилання заявок ще налаштовується. Спробуйте трохи пізніше." }, 503);
  const groupList = groups.map((index, order) => `${order + 1}. ${escapeHtml(groupNames[index])}`).join("\n");
  const text = `<b>Нова заявка на домашню групу</b>\n\n<b>Ім’я:</b> ${escapeHtml(name)}\n<b>Telegram:</b> ${escapeHtml(telegram)}\n\n<b>Обрані групи:</b>\n${groupList}\n\n<i>Надіслано з emmanuil.pages.dev</i>`;
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: env.TELEGRAM_ADMIN_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }) });
  if (!response.ok) return json({ message: "Не вдалося передати заявку адміністратору. Спробуйте ще раз." }, 502);
  return json({ message: "Заявку надіслано. Адміністратор зв’яжеться з вами у Telegram." });
}

async function youtubeLive(request) {
  if (request.method !== "GET") return json({ live: false }, 405);
  try {
    const response = await fetch(youtubeLiveUrl, { headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.7", "User-Agent": "Mozilla/5.0 (compatible; EmmanuilChurch/1.0)" }, redirect: "follow" });
    if (!response.ok) return json({ live: false, available: false }, 502);
    const html = await response.text();
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"&]+)[^"]*"/i);
    const isLiveNow = /["\\]isLiveNow["\\]\s*:\s*true/i.test(html);
    const videoId = canonical?.[1]?.replace(/[^a-zA-Z0-9_-]/g, "");
    return new Response(JSON.stringify(videoId && isLiveNow ? { live: true, videoId } : { live: false }), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=30, s-maxage=45, stale-while-revalidate=60" } });
  } catch {
    return json({ live: false, available: false }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
    const legacyTarget = legacyRedirects[pathname];
    if (legacyTarget) {
      const target = new URL(legacyTarget, url.origin);
      target.search = url.search;
      return Response.redirect(target, 301);
    }
    if (pathname === "/api/group-registration") return register(request, env);
    if (pathname === "/api/youtube-live") return youtubeLive(request);
    return env.ASSETS.fetch(request);
  },
};
