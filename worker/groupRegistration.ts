import { groupNames } from "./data";
import { getCurrentGroups, getCurrentSeason, saveApplication } from "./storage";
import { escapeHtml, isAdmin, json, sendTelegramMessage } from "./telegram";
import type { Env } from "./env";
import type { Group, GroupApplication } from "./types";

function toGroupName(group: Group): string {
  return `${group.title}${group.leaders ? ` — ${group.leaders}` : ""}`;
}

async function resolveCurrentGroups(env: Env): Promise<Group[]> {
  if (env.GROUP_APPLICATIONS) {
    const kvGroups = await getCurrentGroups(env.GROUP_APPLICATIONS);
    if (kvGroups.length) return kvGroups;
  }
  return groupNames.map((title, index) => ({ id: index, title, leaders: "", description: "", time: "", address: "" }));
}

export async function handleGroupRegistration(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if ((request.headers.get("content-length") ?? "0").length > 7 || Number(request.headers.get("content-length") ?? 0) > 12_000) {
    return json({ message: "Завеликий запит." }, 413);
  }
  let body: { name?: unknown; phone?: unknown; groups?: unknown; website?: unknown; startedAt?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ message: "Некоректні дані анкети." }, 400);
  }
  if (body.website) return json({ message: "Заявку прийнято." });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const currentGroups = await resolveCurrentGroups(env);
  const validGroupIds = new Set(currentGroups.map((g) => g.id));
  const groups = Array.isArray(body.groups)
    ? [...new Set(body.groups.filter((item): item is number => Number.isInteger(item) && validGroupIds.has(item)))]
    : [];
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (Date.now() - startedAt < 1_500 || Date.now() - startedAt > 86_400_000) {
    return json({ message: "Оновіть сторінку та заповніть анкету ще раз." }, 400);
  }
  if (name.length < 2 || name.length > 100) return json({ message: "Вкажіть, будь ласка, прізвище та ім’я." }, 400);
  if (phone.length < 9 || phone.length > 20) return json({ message: "Вкажіть коректний номер телефону." }, 400);
  if (!groups.length || groups.length > 2) return json({ message: "Оберіть одну або дві домашні групи." }, 400);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) {
    return json({ message: "Надсилання заявок ще налаштовується. Спробуйте трохи пізніше." }, 503);
  }

  const currentSeason = env.GROUP_APPLICATIONS ? (await getCurrentSeason(env.GROUP_APPLICATIONS)) : null;
  const id = crypto.randomUUID().slice(0, 8);
  const createdAt = Date.now();
  const selectedGroupNames = groups.map((groupId) => {
    const group = currentGroups.find((g) => g.id === groupId);
    return group ? toGroupName(group) : `Група №${groupId}`;
  });
  const application: GroupApplication = {
    id,
    name,
    phone,
    groups,
    groupNames: selectedGroupNames,
    createdAt,
    seasonId: currentSeason?.id ?? "default",
  };

  if (env.GROUP_APPLICATIONS) {
    try {
      await saveApplication(env.GROUP_APPLICATIONS, application);
    } catch (error) {
      console.error("Failed to save application:", error);
    }
  }

  const groupList = selectedGroupNames.map((groupName, order) => `${order + 1}. ${escapeHtml(groupName)}`).join("\n");
  const message = `<b>Нова заявка на домашню групу</b>\n\n<b>Ім’я:</b> ${escapeHtml(name)}\n<b>Телефон:</b> ${escapeHtml(phone)}\n\n<b>Обрані групи:</b>\n${groupList}\n\n<i>Надіслано з emmanuil.pages.dev</i>`;
  const adminUserId = Number(env.TELEGRAM_ADMIN_CHAT_ID);
  const adminByUser = await isAdmin(adminUserId, env);
  const notificationPayload: Record<string, unknown> = {
    chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
    text: message,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Детальніше", callback_data: `app:${id}` }],
      ],
    },
  };
  if (adminByUser) {
    (notificationPayload.reply_markup as { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> }).inline_keyboard.push([
      { text: " Видалити", callback_data: `delete:${id}` },
    ]);
  }
  const response = await sendTelegramMessage(env, notificationPayload);
  if (!response.ok) {
    const body = await response.text().catch(() => "unknown");
    return json({ message: "Не вдалося передати заявку адміністратору.", telegramError: body }, 502);
  }
  return json({ message: "Заявку надіслано. Адміністратор зв’яжеться з вами." });
}
