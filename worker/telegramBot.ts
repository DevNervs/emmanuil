import { groupNames } from "./data";
import {
  countApplications,
  deleteApplication,
  filterApplicationsByGroup,
  getApplication,
  listApplications,
  searchApplications,
} from "./storage";
import { answerCallbackQuery, escapeHtml, isAdmin, json, sendTelegramMessage, verifyWebhookSecret } from "./telegram";
import type { Env } from "./env";
import type { GroupApplication, TelegramCallbackQuery, TelegramMessage, TelegramUpdate } from "./types";

const PAGE_SIZE = 5;

const mainKeyboard = {
  keyboard: [
    [{ text: "🆕 Остання" }, { text: "📋 Список" }],
    [{ text: "📊 Статистика" }, { text: "❓ Допомога" }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
  input_field_placeholder: "Оберіть дію",
};

const menuActions: Record<string, (env: Env, message: TelegramMessage) => Promise<void>> = {
  "🆕 Остання": handleLast,
  "📋 Список": (env, message) => handleList(env, message, ""),
  "📊 Статистика": handleStats,
  "❓ Допомога": (env, message) => handleStart(env, message, ""),
};

function formatApplication(app: GroupApplication, showDelete = false): { text: string; keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> } {
  const groups = app.groupNames.map((name, i) => `${i + 1}. ${escapeHtml(name)}`).join("\n");
  const date = new Date(app.createdAt).toLocaleString("uk-UA");
  const text = `<b>Заявка #${app.id}</b>\n\n<b>Ім’я:</b> ${escapeHtml(app.name)}\n<b>Телефон:</b> ${escapeHtml(app.phone)}\n<b>Групи:</b>\n${groups}\n<b>Дата:</b> ${date}`;
  const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [
    [{ text: "📞 Подзвонити", url: `tel:${app.phone.replace(/[^\d+]/g, "")}` }],
  ];
  if (showDelete) {
    keyboard.push([{ text: "🗑 Видалити", callback_data: `delete:${app.id}` }]);
  }
  keyboard.push([
    { text: "↩️ Назад", callback_data: "list:0" },
    { text: "🏠 Меню", callback_data: "menu" },
  ]);
  return { text, keyboard };
}

function formatAppLine(app: GroupApplication, index: number): string {
  const name = escapeHtml(app.name);
  const shortGroups = app.groupNames.map((g) => g.split(" — ")[0]).join(", ");
  return `${index}. <b>${name}</b> — ${escapeHtml(shortGroups)}`;
}

function buildAppButtons(apps: GroupApplication[], offset: number): Array<Array<{ text: string; callback_data: string }>> {
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < apps.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [{
      text: `${offset + i + 1}. ${escapeHtml(apps[i].name)}`,
      callback_data: `app:${apps[i].id}`,
    }];
    if (apps[i + 1]) {
      row.push({
        text: `${offset + i + 2}. ${escapeHtml(apps[i + 1].name)}`,
        callback_data: `app:${apps[i + 1].id}`,
      });
    }
    keyboard.push(row);
  }
  return keyboard;
}

function buildListKeyboard(apps: GroupApplication[], offset: number, total: number): Array<Array<{ text: string; callback_data: string }>> {
  const keyboard = buildAppButtons(apps, offset);
  const nav: Array<{ text: string; callback_data: string }> = [];
  if (offset > 0) nav.push({ text: "⬅️ Попередні", callback_data: `list:${Math.max(0, offset - PAGE_SIZE)}` });
  if (offset + apps.length < total) nav.push({ text: "Наступні ➡️", callback_data: `list:${offset + PAGE_SIZE}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: "📊 Статистика", callback_data: "stats" }, { text: "🏠 Меню", callback_data: "menu" }]);
  return keyboard;
}

function buildSimpleAppKeyboard(apps: GroupApplication[], offset = 0): Array<Array<{ text: string; callback_data: string }>> {
  const keyboard = buildAppButtons(apps, offset);
  keyboard.push([{ text: "🏠 Меню", callback_data: "menu" }]);
  return keyboard;
}

function parseCommand(text: string): { command: string; args: string } {
  const trimmed = text.trim();
  const match = trimmed.match(/^\/([a-zA-Z0-9_]+)(?:\s+([\s\S]+))?$/);
  if (!match) return { command: "", args: "" };
  return { command: match[1].toLowerCase(), args: (match[2] ?? "").trim() };
}

async function sendAdminMessage(env: Env, chatId: number, payload: Record<string, unknown>): Promise<void> {
  const response = await sendTelegramMessage(env, { chat_id: chatId, ...payload });
  if (!response.ok) {
    const text = await response.text().catch(() => "unknown");
    console.error("Telegram send failed:", response.status, text);
  }
}

async function sendNoAccess(env: Env, chatId: number): Promise<void> {
  await sendAdminMessage(env, chatId, { text: "У вас немає доступу до цієї команди." });
}

async function handleStart(env: Env, message: TelegramMessage, args: string): Promise<void> {
  const chatId = message.chat.id;
  const appArg = args.startsWith("app_") ? args.slice(4) : "";
  if (appArg && env.GROUP_APPLICATIONS) {
    const app = await getApplication(env.GROUP_APPLICATIONS, appArg);
    if (app) {
      const { text, keyboard } = formatApplication(app, true);
      await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
      return;
    }
  }
  const text = `Привіт, ${escapeHtml(message.from.first_name)}!\n\nЯ бот для управління заявками на домашні групи.\n\n<b>Команди:</b>\n/last — остання заявка\n/list — список заявок\n/search &lt;прізвище&gt; — пошук\n/group &lt;номер&gt; — фільтр за групою\n/stats — статистика\n/delete &lt;id&gt; — видалити`;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: mainKeyboard });
}

async function handleLast(env: Env, message: TelegramMessage): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const { apps } = await listApplications(env.GROUP_APPLICATIONS, { limit: 1 });
  if (!apps.length) {
    await sendAdminMessage(env, message.chat.id, { text: "Заявок поки немає." });
    return;
  }
  const { text, keyboard } = formatApplication(apps[0], true);
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleList(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const offset = Math.max(0, Number(args) || 0);
  const { apps, total } = await listApplications(env.GROUP_APPLICATIONS, { offset, limit: PAGE_SIZE });
  if (!apps.length) {
    await sendAdminMessage(env, message.chat.id, { text: offset === 0 ? "Заявок поки немає." : "Більше заявок немає." });
    return;
  }
  const lines = apps.map((app, i) => formatAppLine(app, offset + i + 1)).join("\n");
  const text = `<b>Заявки (${offset + 1}–${Math.min(offset + apps.length, total)} з ${total})</b>\n\n${lines}`;
  const keyboard = buildListKeyboard(apps, offset, total);
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleSearch(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  if (!args) {
    await sendAdminMessage(env, message.chat.id, { text: "Вкажіть пошуковий запит: /search Іваненко" });
    return;
  }
  const results = await searchApplications(env.GROUP_APPLICATIONS, args);
  if (!results.length) {
    await sendAdminMessage(env, message.chat.id, { text: "Нічого не знайдено." });
    return;
  }
  const limited = results.slice(0, 10);
  const lines = limited.map((app, i) => formatAppLine(app, i + 1)).join("\n");
  const text = `<b>Знайдено ${results.length} заявок</b>\n\n${lines}`;
  const keyboard = buildSimpleAppKeyboard(limited);
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleGroup(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const groupIndex = Number(args) - 1;
  if (!Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex >= groupNames.length) {
    await sendAdminMessage(env, message.chat.id, { text: `Вкажіть номер групи від 1 до ${groupNames.length}: /group 3` });
    return;
  }
  const results = await filterApplicationsByGroup(env.GROUP_APPLICATIONS, groupIndex);
  if (!results.length) {
    await sendAdminMessage(env, message.chat.id, { text: `На групу №${groupIndex + 1} заявок немає.` });
    return;
  }
  const limited = results.slice(0, 10);
  const lines = limited.map((app, i) => formatAppLine(app, i + 1)).join("\n");
  const text = `<b>Група ${escapeHtml(groupNames[groupIndex])}</b>\nВсього заявок: ${results.length}\n\n${lines}`;
  const keyboard = buildSimpleAppKeyboard(limited);
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleStats(env: Env, message: TelegramMessage): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const total = await countApplications(env.GROUP_APPLICATIONS);
  const groupCounts: Record<string, number> = {};
  const all = await listApplications(env.GROUP_APPLICATIONS, { limit: total });
  for (const app of all.apps) {
    for (const groupName of app.groupNames) {
      groupCounts[groupName] = (groupCounts[groupName] ?? 0) + 1;
    }
  }
  const groupLines = Object.entries(groupCounts)
    .map(([name, count]) => `• ${escapeHtml(name.split(" — ")[0])}: ${count}`)
    .join("\n");
  const text = `<b>Статистика</b>\n\nВсього заявок: ${total}\n\n<b>За групами:</b>\n${groupLines}`;
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML" });
}

async function handleDeleteCommand(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  if (!args) {
    await sendAdminMessage(env, message.chat.id, { text: "Вкажіть id заявки: /delete abc123" });
    return;
  }
  await deleteApplication(env.GROUP_APPLICATIONS, args);
  await sendAdminMessage(env, message.chat.id, { text: `Заявку #${args} видалено.` });
}

async function handleAppCallback(env: Env, query: TelegramCallbackQuery, id: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  const app = await getApplication(env.GROUP_APPLICATIONS, id);
  if (!app) {
    await answerCallbackQuery(env, query.id, "Заявку не знайдено");
    return;
  }
  await answerCallbackQuery(env, query.id);
  const chatId = query.message?.chat.id ?? query.from.id;
  const { text, keyboard } = formatApplication(app, true);
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleListCallback(env: Env, query: TelegramCallbackQuery, offsetStr: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  const offset = Math.max(0, Number(offsetStr) || 0);
  const { apps, total } = await listApplications(env.GROUP_APPLICATIONS, { offset, limit: PAGE_SIZE });
  await answerCallbackQuery(env, query.id);
  if (!apps.length) {
    const chatId = query.message?.chat.id ?? query.from.id;
    await sendAdminMessage(env, chatId, { text: offset === 0 ? "Заявок поки немає." : "Більше заявок немає." });
    return;
  }
  const lines = apps.map((app, i) => formatAppLine(app, offset + i + 1)).join("\n");
  const text = `<b>Заявки (${offset + 1}–${Math.min(offset + apps.length, total)} з ${total})</b>\n\n${lines}`;
  const keyboard = buildListKeyboard(apps, offset, total);
  const chatId = query.message?.chat.id ?? query.from.id;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleDeleteCallback(env: Env, query: TelegramCallbackQuery, id: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  await deleteApplication(env.GROUP_APPLICATIONS, id);
  await answerCallbackQuery(env, query.id, "Заявку видалено");
  const chatId = query.message?.chat.id ?? query.from.id;
  await sendAdminMessage(env, chatId, { text: `Заявку #${id} видалено.` });
}

async function handleMessage(env: Env, message: TelegramMessage): Promise<void> {
  const userId = message.from.id;
  if (!isAdmin(userId, env)) {
    await sendNoAccess(env, message.chat.id);
    return;
  }
  const text = message.text ?? "";
  const menuAction = menuActions[text];
  if (menuAction) {
    await menuAction(env, message);
    return;
  }
  const { command, args } = parseCommand(text);
  switch (command) {
    case "start":
      await handleStart(env, message, args);
      break;
    case "help":
      await handleStart(env, message, "");
      break;
    case "last":
      await handleLast(env, message);
      break;
    case "list":
      await handleList(env, message, args);
      break;
    case "search":
      await handleSearch(env, message, args);
      break;
    case "group":
      await handleGroup(env, message, args);
      break;
    case "stats":
      await handleStats(env, message);
      break;
    case "delete":
      await handleDeleteCommand(env, message, args);
      break;
    default:
      await sendAdminMessage(env, message.chat.id, { text: "Невідома команда. Використайте /help." });
  }
}

async function handleMenuCallback(env: Env, query: TelegramCallbackQuery): Promise<void> {
  await answerCallbackQuery(env, query.id);
  const chatId = query.message?.chat.id ?? query.from.id;
  const text = `<b>Головне меню</b>\n\n<b>Команди:</b>\n/last — остання заявка\n/list — список заявок\n/search &lt;прізвище&gt; — пошук\n/group &lt;номер&gt; — фільтр за групою\n/stats — статистика\n/delete &lt;id&gt; — видалити`;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: mainKeyboard });
}

async function handleStatsCallback(env: Env, query: TelegramCallbackQuery): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  await answerCallbackQuery(env, query.id);
  const total = await countApplications(env.GROUP_APPLICATIONS);
  const groupCounts: Record<string, number> = {};
  const all = await listApplications(env.GROUP_APPLICATIONS, { limit: total });
  for (const app of all.apps) {
    for (const groupName of app.groupNames) {
      groupCounts[groupName] = (groupCounts[groupName] ?? 0) + 1;
    }
  }
  const groupLines = Object.entries(groupCounts)
    .map(([name, count]) => `• ${escapeHtml(name.split(" — ")[0])}: ${count}`)
    .join("\n");
  const text = `<b>Статистика</b>\n\nВсього заявок: ${total}\n\n<b>За групами:</b>\n${groupLines}`;
  const chatId = query.message?.chat.id ?? query.from.id;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🏠 Меню", callback_data: "menu" }]] } });
}

async function handleCallback(env: Env, query: TelegramCallbackQuery): Promise<void> {
  const userId = query.from.id;
  if (!isAdmin(userId, env)) {
    await answerCallbackQuery(env, query.id, "У вас немає доступу");
    return;
  }
  const data = query.data ?? "";
  if (data === "menu") {
    await handleMenuCallback(env, query);
    return;
  }
  if (data === "stats") {
    await handleStatsCallback(env, query);
    return;
  }
  const [prefix, value] = data.split(":");
  switch (prefix) {
    case "app":
      await handleAppCallback(env, query, value);
      break;
    case "list":
      await handleListCallback(env, query, value);
      break;
    case "delete":
      await handleDeleteCallback(env, query, value);
      break;
    default:
      await answerCallbackQuery(env, query.id, "Невідома дія");
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  if (update.message) {
    await handleMessage(env, update.message);
  } else if (update.callback_query) {
    await handleCallback(env, update.callback_query);
  }
}

export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  if (!env.TELEGRAM_BOT_TOKEN) return json({ message: "Telegram bot token not configured" }, 503);
  if (!verifyWebhookSecret(request, env)) return json({ message: "Unauthorized" }, 401);
  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return json({ message: "Некоректні дані." }, 400);
  }
  await handleTelegramUpdate(update, env).catch((error) => {
    console.error("Telegram update error:", error);
  });
  return json({ ok: true });
}

export async function setupTelegramWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ message: "Метод не підтримується." }, 405);
  const auth = request.headers.get("Authorization");
  const expected = env.TELEGRAM_WEBHOOK_SECRET ? `Bearer ${env.TELEGRAM_WEBHOOK_SECRET}` : "";
  if (expected && auth !== expected) return json({ message: "Unauthorized" }, 401);
  if (!env.TELEGRAM_BOT_TOKEN) return json({ message: "Telegram bot token not configured" }, 503);

  const url = new URL(request.url);
  const webhookUrl = `${url.origin}/api/telegram`;
  const params = new URLSearchParams({
    url: webhookUrl,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET ?? "",
  });
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?${params.toString()}`);
  const result = (await response.json().catch(() => ({ ok: false, description: "unknown" }))) as { ok: boolean; description?: string };
  if (!response.ok || !result.ok) {
    return json({ message: "Не вдалося налаштувати webhook", result }, 502);
  }
  return json({ message: "Webhook налаштовано", webhookUrl });
}
