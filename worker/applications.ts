import { groupNames, servingNames } from "./data";
import { getCurrentGroups, getCurrentSeason, getServings, saveApplication } from "./storage";
import { escapeHtml, isAdmin, json, sendTelegramMessage } from "./telegram";
import type { Env } from "./env";
import type { Group, GroupApplication, Serving } from "./types";

export function toGroupName(group: Group): string {
  return `${group.title}${group.leaders ? ` — ${group.leaders}` : ""}`;
}

export async function resolveCurrentGroups(env: Env): Promise<Group[]> {
  if (env.GROUP_APPLICATIONS) {
    const kvGroups = await getCurrentGroups(env.GROUP_APPLICATIONS);
    if (kvGroups.length) return kvGroups;
  }
  return groupNames.map((title, index) => ({ id: index, title, leaders: "", description: "", time: "", address: "" }));
}

export async function resolveCurrentServings(env: Env): Promise<Serving[]> {
  if (env.GROUP_APPLICATIONS) {
    const kvServings = await getServings(env.GROUP_APPLICATIONS);
    if (kvServings.length) return kvServings;
  }
  return servingNames.map((title, index) => ({ id: index + 1, title, description: "" }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringField(body: Record<string, unknown>, key: string, maxLength: number): string {
  const value = body[key];
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function tooLarge(request: Request): boolean {
  return (request.headers.get("content-length") ?? "0").length > 7 || Number(request.headers.get("content-length") ?? 0) > 12_000;
}

function startedAtInvalid(body: Record<string, unknown>): boolean {
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  return Date.now() - startedAt < 1_500 || Date.now() - startedAt > 86_400_000;
}

export async function saveAndNotify(
  env: Env,
  application: Omit<GroupApplication, "createdAt" | "seasonId">,
  heading: string,
  detailsHtml: string,
): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) {
    return json({ message: "Надсилання заявок ще налаштовується. Спробуйте трохи пізніше." }, 503);
  }

  const currentSeason = env.GROUP_APPLICATIONS ? (await getCurrentSeason(env.GROUP_APPLICATIONS)) : null;
  const createdAt = Date.now();
  const record: GroupApplication = {
    ...application,
    createdAt,
    seasonId: currentSeason?.id ?? "default",
  };

  if (env.GROUP_APPLICATIONS) {
    try {
      await saveApplication(env.GROUP_APPLICATIONS, record);
    } catch (error) {
      console.error("Failed to save application:", error);
    }
  }

  const message = `<b>${heading}</b>\n\n<b>Ім’я:</b> ${escapeHtml(record.name)}\n${record.phone ? `<b>Телефон:</b> ${escapeHtml(record.phone)}\n` : ""}${record.email ? `<b>E-mail:</b> ${escapeHtml(record.email)}\n` : ""}\n${detailsHtml}\n\n<i>Надіслано з emmanuil.pages.dev</i>`;
  const adminUserId = Number(env.TELEGRAM_ADMIN_CHAT_ID);
  const adminByUser = await isAdmin(adminUserId, env);
  const notificationPayload: Record<string, unknown> = {
    chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Детальніше", callback_data: `app:${record.id}` }],
      ],
    },
  };
  if (adminByUser) {
    (notificationPayload.reply_markup as { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }).inline_keyboard.push([
      { text: "🗑 Видалити", callback_data: `delete:${record.id}` },
    ]);
  }
  const response = await sendTelegramMessage(env, notificationPayload);
  if (!response.ok) {
    const body = await response.text().catch(() => "unknown");
    return json({ message: "Не вдалося передати заявку адміністратору.", telegramError: body }, 502);
  }
  return json({ message: "Заявку надіслано. Адміністратор зв’яжеться з вами." });
}

async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

export async function handleServingRegistration(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if (tooLarge(request)) return json({ message: "Завеликий запит." }, 413);
  const body = await parseBody(request);
  if (!body) return json({ message: "Некоректні дані анкети." }, 400);
  if (body.website) return json({ message: "Заявку прийнято." });
  if (startedAtInvalid(body)) {
    return json({ message: "Оновіть сторінку та заповніть анкету ще раз." }, 400);
  }

  const name = stringField(body, "name", 100);
  const phone = stringField(body, "phone", 20);
  const note = stringField(body, "message", 1000);
  if (name.length < 2) return json({ message: "Вкажіть, будь ласка, прізвище та ім’я." }, 400);
  if (phone.length < 9) return json({ message: "Вкажіть коректний номер телефону." }, 400);

  const servings = await resolveCurrentServings(env);
  const servingId = typeof body.serving === "number" ? body.serving : Number(body.serving);
  const serving = servings.find((item) => item.id === servingId);
  if (!serving) return json({ message: "Оберіть служіння зі списку." }, 400);

  const id = crypto.randomUUID().slice(0, 8);
  const detailsHtml = `<b>Служіння:</b> ${escapeHtml(serving.title)}${note ? `\n<b>Коментар:</b> ${escapeHtml(note)}` : ""}`;
  return saveAndNotify(env, {
    id,
    type: "serving",
    name,
    phone,
    groups: [],
    groupNames: [],
    serving: serving.title,
    message: note || undefined,
  }, "Нова заявка на служіння", detailsHtml);
}

export async function handleQuestionSubmission(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if (tooLarge(request)) return json({ message: "Завеликий запит." }, 413);
  const body = await parseBody(request);
  if (!body) return json({ message: "Некоректні дані." }, 400);
  if (body.website) return json({ message: "Повідомлення надіслано." });
  if (startedAtInvalid(body)) {
    return json({ message: "Оновіть сторінку та заповніть форму ще раз." }, 400);
  }

  const name = stringField(body, "name", 100);
  const email = stringField(body, "email", 120);
  const phone = stringField(body, "phone", 20);
  const question = stringField(body, "message", 2000);
  if (name.length < 2) return json({ message: "Вкажіть, будь ласка, ваше ім’я." }, 400);
  if (question.length < 5) return json({ message: "Напишіть, будь ласка, ваше питання." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ message: "Вкажіть коректний e-mail." }, 400);
  }
  if (!email && phone.length < 9) {
    return json({ message: "Вкажіть e-mail або номер телефону, щоб ми могли відповісти." }, 400);
  }

  const id = crypto.randomUUID().slice(0, 8);
  const detailsHtml = `<b>Питання:</b>\n${escapeHtml(question)}`;
  return saveAndNotify(env, {
    id,
    type: "question",
    name,
    phone,
    email: email || undefined,
    groups: [],
    groupNames: [],
    message: question,
  }, "Нове питання з сайту", detailsHtml);
}

export async function handleServingsApi(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return json({ message: "Метод не підтримується." }, 405);
  const servings = await resolveCurrentServings(env);
  return json({ servings });
}
