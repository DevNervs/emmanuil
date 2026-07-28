export interface TelegramEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;
}

const groupNames = [
  "№1. Духовний ріст — Клодницький Віталій",
  "№2. Духовний ріст — Григорчук Олександр, Маковей Богдан",
  "№3. Духовний ріст — Маковій Михайло, Никифорець Валерій",
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

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export async function handleGroupRegistration(request: Request, env: TelegramEnv): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if ((request.headers.get("content-length") ?? "0").length > 7 || Number(request.headers.get("content-length") ?? 0) > 12_000) return json({ message: "Завеликий запит." }, 413);
  let body: { name?: unknown; phone?: unknown; groups?: unknown; website?: unknown; startedAt?: unknown };
  try { body = await request.json(); } catch { return json({ message: "Некоректні дані анкети." }, 400); }
  if (body.website) return json({ message: "Заявку прийнято." });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const groups = Array.isArray(body.groups) ? [...new Set(body.groups.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < groupNames.length))] : [];
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (Date.now() - startedAt < 1_500 || Date.now() - startedAt > 86_400_000) return json({ message: "Оновіть сторінку та заповніть анкету ще раз." }, 400);
  if (name.length < 2 || name.length > 100) return json({ message: "Вкажіть, будь ласка, прізвище та ім’я." }, 400);
  if (phone.length < 9 || phone.length > 20) return json({ message: "Вкажіть коректний номер телефону." }, 400);
  if (!groups.length || groups.length > 2) return json({ message: "Оберіть одну або дві домашні групи." }, 400);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) return json({ message: "Надсилання заявок ще налаштовується. Спробуйте трохи пізніше." }, 503);
  const groupList = groups.map((index, order) => `${order + 1}. ${escapeHtml(groupNames[index])}`).join("\n");
  const message = `<b>Нова заявка на домашню групу</b>\n\n<b>Ім’я:</b> ${escapeHtml(name)}\n<b>Телефон:</b> ${escapeHtml(phone)}\n\n<b>Обрані групи:</b>\n${groupList}\n\n<i>Надіслано з emmanuil.pages.dev</i>`;
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: env.TELEGRAM_ADMIN_CHAT_ID, text: message, parse_mode: "HTML", disable_web_page_preview: true }) });
  if (!response.ok) return json({ message: "Не вдалося передати заявку адміністратору. Спробуйте ще раз." }, 502);
  return json({ message: "Заявку надіслано. Адміністратор зв’яжеться з вами." });
}
