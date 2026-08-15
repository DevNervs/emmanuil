import { groupNames } from "./data";
import {
  addAdmin,
  applicationType,
  countApplications,
  deleteApplication,
  filterApplicationsByGroup,
  getAdmins,
  getApplication,
  getCurrentGroups,
  getCurrentSeason,
  listApplications,
  removeAdmin,
  searchApplications,
} from "./storage";
import { answerCallbackQuery, escapeHtml, isAdmin, json, sendTelegramMessage, verifyWebhookSecret } from "./telegram";
import type { Env } from "./env";
import type { ApplicationType, Group, GroupApplication, TelegramCallbackQuery, TelegramMessage, TelegramUpdate } from "./types";

const PAGE_SIZE = 5;

type TypeFilter = ApplicationType | "all";

const TYPE_LABELS: Record<ApplicationType, string> = {
  group: "Домашня група",
  serving: "Служіння",
  question: "Питання",
};

const TYPE_EMOJI: Record<ApplicationType, string> = {
  group: "🏠",
  serving: "🙏",
  question: "💬",
};

function parseTypeArg(args: string): TypeFilter {
  const normalized = args.trim().toLowerCase();
  if (["group", "groups", "група", "групи", "домашня", "home"].includes(normalized)) return "group";
  if (["serving", "служіння", "служба"].includes(normalized)) return "serving";
  if (["question", "questions", "питання", "запитання"].includes(normalized)) return "question";
  return "all";
}

function typeFilterOption(type: TypeFilter): ApplicationType | undefined {
  return type === "all" ? undefined : type;
}

const mainKeyboard = {
  keyboard: [
    [{ text: "🆕 Остання" }, { text: "📋 Список" }],
    [{ text: "🏠 Домашні групи" }, { text: "🙏 Служіння" }],
    [{ text: "💬 Питання" }, { text: "📊 Статистика" }],
    [{ text: "👥 Адміни" }, { text: "📅 Сезон" }],
    [{ text: "🗂 Каталог груп" }, { text: "❓ Допомога" }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
  input_field_placeholder: "Оберіть дію",
};

const menuActions: Record<string, (env: Env, message: TelegramMessage) => Promise<void>> = {
  "🆕 Остання": (env, message) => handleLast(env, message, ""),
  "📋 Список": (env, message) => handleList(env, message, ""),
  "🏠 Домашні групи": (env, message) => handleList(env, message, "group"),
  "🙏 Служіння": (env, message) => handleList(env, message, "serving"),
  "💬 Питання": (env, message) => handleList(env, message, "question"),
  "📊 Статистика": handleStats,
  "👥 Адміни": handleAdmins,
  "📅 Сезон": handleSeason,
  "🗂 Каталог груп": handleGroups,
  "❓ Допомога": (env, message) => handleStart(env, message, ""),
};

async function resolveCurrentGroups(env: Env): Promise<Group[]> {
  if (env.GROUP_APPLICATIONS) {
    const kvGroups = await getCurrentGroups(env.GROUP_APPLICATIONS);
    if (kvGroups.length) return kvGroups;
  }
  return groupNames.map((title, index) => ({
    id: index,
    title,
    leaders: "",
    description: "",
    time: "",
    address: "",
  }));
}

function toGroupName(group: Group): string {
  return `${group.title}${group.leaders ? ` — ${group.leaders}` : ""}`;
}

function formatApplication(app: GroupApplication, showDelete = false): { text: string; keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> } {
  const type = applicationType(app);
  const date = new Date(app.createdAt).toLocaleString("uk-UA");
  const lines: string[] = [
    `<b>Заявка #${app.id}</b> · ${TYPE_EMOJI[type]} ${TYPE_LABELS[type]}`,
    "",
    `<b>Ім’я:</b> ${escapeHtml(app.name)}`,
  ];
  if (app.phone) lines.push(`<b>Телефон:</b> ${escapeHtml(app.phone)}`);
  if (app.email) lines.push(`<b>E-mail:</b> ${escapeHtml(app.email)}`);
  if (type === "serving") {
    lines.push(`<b>Служіння:</b> ${escapeHtml(app.serving ?? "—")}`);
    if (app.message) lines.push(`<b>Коментар:</b> ${escapeHtml(app.message)}`);
  } else if (type === "question") {
    lines.push(`<b>Питання:</b>\n${escapeHtml(app.message ?? "")}`);
  } else {
    lines.push(`<b>Групи:</b>\n${app.groupNames.map((name, i) => `${i + 1}. ${escapeHtml(name)}`).join("\n")}`);
  }
  lines.push(`<b>Дата:</b> ${date}`);
  const text = lines.join("\n");
  const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];
  if (showDelete) {
    keyboard.push([{ text: "🗑 Видалити", callback_data: `delete:${app.id}` }]);
  }
  keyboard.push([
    { text: "↩️ Назад", callback_data: "list:all:0" },
    { text: "🏠 Меню", callback_data: "menu" },
  ]);
  return { text, keyboard };
}

function formatAppLine(app: GroupApplication, index: number): string {
  const type = applicationType(app);
  const name = escapeHtml(app.name);
  let detail: string;
  if (type === "serving") {
    detail = app.serving ?? "—";
  } else if (type === "question") {
    detail = (app.message ?? "").replace(/\s+/g, " ").slice(0, 48);
  } else {
    detail = app.groupNames.map((g) => g.split(" — ")[0]).join(", ");
  }
  return `${index}. ${TYPE_EMOJI[type]} <b>${name}</b> — ${escapeHtml(detail)}`;
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

function buildListKeyboard(apps: GroupApplication[], offset: number, total: number, type: TypeFilter = "all"): Array<Array<{ text: string; callback_data: string }>> {
  const keyboard = buildAppButtons(apps, offset);
  const nav: Array<{ text: string; callback_data: string }> = [];
  if (offset > 0) nav.push({ text: "⬅️ Попередні", callback_data: `list:${type}:${Math.max(0, offset - PAGE_SIZE)}` });
  if (offset + apps.length < total) nav.push({ text: "Наступні ➡️", callback_data: `list:${type}:${offset + PAGE_SIZE}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: "📊 Статистика", callback_data: "stats" }, { text: "🏠 Меню", callback_data: "menu" }]);
  return keyboard;
}

const helpText = `<b>Команди:</b>
/last [тип] — остання заявка
/list [тип] — список заявок
/search &lt;прізвище&gt; — пошук
/group &lt;номер&gt; — фільтр за групою
/serving — заявки на служіння
/questions — питання з сайту
/stats — статистика
/groups — список груп
/season — поточний сезон
/admins — адміни
/delete &lt;id&gt; — видалити

<b>Типи заявок:</b> групи, служіння, питання.`;

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
    const app = await getApplication(env.GROUP_APPLICATIONS, appArg, true);
    if (app) {
      const { text, keyboard } = formatApplication(app, true);
      await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
      return;
    }
  }
  const text = `Привіт, ${escapeHtml(message.from.first_name)}!\n\nЯ бот для управління заявками: домашні групи, служіння та питання з сайту.\n\n${helpText}`;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: mainKeyboard });
}

async function handleLast(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const type = parseTypeArg(args);
  const { apps } = await listApplications(env.GROUP_APPLICATIONS, { limit: 1, type: typeFilterOption(type) });
  if (!apps.length) {
    await sendAdminMessage(env, message.chat.id, { text: type === "all" ? "Заявок поки немає." : "Заявок цього типу поки немає." });
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
  const type = parseTypeArg(args);
  const offset = type === "all" && /^\d+$/.test(args.trim()) ? Math.max(0, Number(args)) : 0;
  const { apps, total } = await listApplications(env.GROUP_APPLICATIONS, { offset, limit: PAGE_SIZE, type: typeFilterOption(type) });
  if (!apps.length) {
    await sendAdminMessage(env, message.chat.id, { text: offset === 0 ? "Заявок поки немає." : "Більше заявок немає." });
    return;
  }
  const lines = apps.map((app, i) => formatAppLine(app, offset + i + 1)).join("\n");
  const title = type === "all" ? "Заявки" : `${TYPE_EMOJI[type]} ${TYPE_LABELS[type]} — заявки`;
  const text = `<b>${title} (${offset + 1}–${Math.min(offset + apps.length, total)} з ${total})</b>\n\n${lines}`;
  const keyboard = buildListKeyboard(apps, offset, total, type);
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
  const groups = await resolveCurrentGroups(env);
  const index = Number(args) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= groups.length) {
    await sendAdminMessage(env, message.chat.id, { text: `Вкажіть номер групи від 1 до ${groups.length}: /group 3` });
    return;
  }
  const group = groups[index];
  const results = await filterApplicationsByGroup(env.GROUP_APPLICATIONS, group.id);
  if (!results.length) {
    await sendAdminMessage(env, message.chat.id, { text: `На групу №${index + 1} (${escapeHtml(group.title)}) заявок немає.` });
    return;
  }
  const limited = results.slice(0, 10);
  const lines = limited.map((app, i) => formatAppLine(app, i + 1)).join("\n");
  const text = `<b>Група ${escapeHtml(toGroupName(group))}</b>\nВсього заявок: ${results.length}\n\n${lines}`;
  const keyboard = buildSimpleAppKeyboard(limited);
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleGroups(env: Env, message: TelegramMessage): Promise<void> {
  const groups = await resolveCurrentGroups(env);
  if (!groups.length) {
    await sendAdminMessage(env, message.chat.id, { text: "Групи ще не налаштовані." });
    return;
  }
  const lines = groups.map((g, i) => `${i + 1}. <b>${escapeHtml(toGroupName(g))}</b>${g.address ? `\n   📍 ${escapeHtml(g.address)}` : ""}`).join("\n");
  const text = `<b>Список груп</b>\n\n${lines}`;
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML" });
}

async function handleSeason(env: Env, message: TelegramMessage): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const season = await getCurrentSeason(env.GROUP_APPLICATIONS);
  if (!season) {
    await sendAdminMessage(env, message.chat.id, { text: "Поточний сезон не налаштований." });
    return;
  }
  const total = await countApplications(env.GROUP_APPLICATIONS);
  const text = `<b>Поточний сезон</b>\n\nНазва: ${escapeHtml(season.name)}\nПочаток: ${new Date(season.startedAt).toLocaleString("uk-UA")}\nЗаявок: ${total}`;
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML" });
}

async function handleAdmins(env: Env, message: TelegramMessage): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const admins = await getAdmins(env.GROUP_APPLICATIONS);
  const text = `<b>Адміністратори</b>\n\n${admins.length ? admins.map((id) => `• ${id}`).join("\n") : "Адміністраторів не додано."}`;
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML" });
}

async function buildStatsText(kv: KVNamespace): Promise<string> {
  const total = await countApplications(kv);
  const all = await listApplications(kv, { limit: Math.max(total, 1) });
  const byType: Record<ApplicationType, number> = { group: 0, serving: 0, question: 0 };
  const groupCounts: Record<string, number> = {};
  const servingCounts: Record<string, number> = {};
  for (const app of all.apps) {
    const type = applicationType(app);
    byType[type] += 1;
    if (type === "group") {
      for (const groupName of app.groupNames) {
        groupCounts[groupName] = (groupCounts[groupName] ?? 0) + 1;
      }
    } else if (type === "serving" && app.serving) {
      servingCounts[app.serving] = (servingCounts[app.serving] ?? 0) + 1;
    }
  }
  const sections: string[] = [
    `<b>Статистика</b>`,
    "",
    `Всього заявок: ${total}`,
    `${TYPE_EMOJI.group} Домашні групи: ${byType.group}`,
    `${TYPE_EMOJI.serving} Служіння: ${byType.serving}`,
    `${TYPE_EMOJI.question} Питання: ${byType.question}`,
  ];
  if (Object.keys(groupCounts).length) {
    sections.push("", "<b>За групами:</b>");
    sections.push(...Object.entries(groupCounts).map(([name, count]) => `• ${escapeHtml(name.split(" — ")[0])}: ${count}`));
  }
  if (Object.keys(servingCounts).length) {
    sections.push("", "<b>За служіннями:</b>");
    sections.push(...Object.entries(servingCounts).map(([name, count]) => `• ${escapeHtml(name)}: ${count}`));
  }
  return sections.join("\n");
}

async function handleStats(env: Env, message: TelegramMessage): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const text = await buildStatsText(env.GROUP_APPLICATIONS);
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
  const app = await getApplication(env.GROUP_APPLICATIONS, args, true);
  if (!app) {
    await sendAdminMessage(env, message.chat.id, { text: `Заявку #${args} не знайдено.` });
    return;
  }
  const text = `Ви впевнені, що хочете видалити заявку <b>#${args}</b> від ${escapeHtml(app.name)}?`;
  const keyboard = [
    [
      { text: "✅ Так, видалити", callback_data: `confirm_delete:${args}` },
      { text: "❌ Скасувати", callback_data: `cancel_delete:${args}` },
    ],
  ];
  await sendAdminMessage(env, message.chat.id, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleAdminAddCommand(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const id = Number(args);
  if (!Number.isInteger(id)) {
    await sendAdminMessage(env, message.chat.id, { text: "Вкажіть user id: /admin_add 123456789" });
    return;
  }
  await addAdmin(env.GROUP_APPLICATIONS, id);
  await sendAdminMessage(env, message.chat.id, { text: `Користувача ${id} додано до адміністраторів.` });
}

async function handleAdminRemoveCommand(env: Env, message: TelegramMessage, args: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await sendAdminMessage(env, message.chat.id, { text: "Сховище заявок ще не налаштоване." });
    return;
  }
  const id = Number(args);
  if (!Number.isInteger(id)) {
    await sendAdminMessage(env, message.chat.id, { text: "Вкажіть user id: /admin_remove 123456789" });
    return;
  }
  await removeAdmin(env.GROUP_APPLICATIONS, id);
  await sendAdminMessage(env, message.chat.id, { text: `Користувача ${id} видалено з адміністраторів.` });
}

async function handleAppCallback(env: Env, query: TelegramCallbackQuery, id: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  const app = await getApplication(env.GROUP_APPLICATIONS, id, true);
  if (!app) {
    await answerCallbackQuery(env, query.id, "Заявку не знайдено");
    return;
  }
  await answerCallbackQuery(env, query.id);
  const chatId = query.message?.chat.id ?? query.from.id;
  const { text, keyboard } = formatApplication(app, true);
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

function parseListValue(value: string): { type: TypeFilter; offset: number } {
  const [first, second] = value.split(":");
  if (second !== undefined) {
    return { type: parseTypeArg(first), offset: Math.max(0, Number(second) || 0) };
  }
  return { type: "all", offset: Math.max(0, Number(first) || 0) };
}

async function handleListCallback(env: Env, query: TelegramCallbackQuery, value: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  const { type, offset } = parseListValue(value);
  const { apps, total } = await listApplications(env.GROUP_APPLICATIONS, { offset, limit: PAGE_SIZE, type: typeFilterOption(type) });
  await answerCallbackQuery(env, query.id);
  if (!apps.length) {
    const chatId = query.message?.chat.id ?? query.from.id;
    await sendAdminMessage(env, chatId, { text: offset === 0 ? "Заявок поки немає." : "Більше заявок немає." });
    return;
  }
  const lines = apps.map((app, i) => formatAppLine(app, offset + i + 1)).join("\n");
  const title = type === "all" ? "Заявки" : `${TYPE_EMOJI[type]} ${TYPE_LABELS[type]} — заявки`;
  const text = `<b>${title} (${offset + 1}–${Math.min(offset + apps.length, total)} з ${total})</b>\n\n${lines}`;
  const keyboard = buildListKeyboard(apps, offset, total, type);
  const chatId = query.message?.chat.id ?? query.from.id;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleDeleteCallback(env: Env, query: TelegramCallbackQuery, id: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  const app = await getApplication(env.GROUP_APPLICATIONS, id, true);
  if (!app) {
    await answerCallbackQuery(env, query.id, "Заявку не знайдено");
    return;
  }
  await answerCallbackQuery(env, query.id);
  const chatId = query.message?.chat.id ?? query.from.id;
  const text = `Ви впевнені, що хочете видалити заявку <b>#${id}</b> від ${escapeHtml(app.name)}?`;
  const keyboard = [
    [
      { text: "✅ Так, видалити", callback_data: `confirm_delete:${id}` },
      { text: "❌ Скасувати", callback_data: `cancel_delete:${id}` },
    ],
  ];
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleConfirmDeleteCallback(env: Env, query: TelegramCallbackQuery, id: string): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  await deleteApplication(env.GROUP_APPLICATIONS, id, true);
  await answerCallbackQuery(env, query.id, "Заявку видалено");
  const chatId = query.message?.chat.id ?? query.from.id;
  await sendAdminMessage(env, chatId, { text: `Заявку #${id} видалено.` });
}

async function handleCancelDeleteCallback(env: Env, query: TelegramCallbackQuery, id: string): Promise<void> {
  await answerCallbackQuery(env, query.id, "Видалення скасовано");
  if (!env.GROUP_APPLICATIONS) return;
  const app = await getApplication(env.GROUP_APPLICATIONS, id, true);
  if (!app) return;
  const chatId = query.message?.chat.id ?? query.from.id;
  const { text, keyboard } = formatApplication(app, true);
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
}

async function handleMenuCallback(env: Env, query: TelegramCallbackQuery): Promise<void> {
  await answerCallbackQuery(env, query.id);
  const chatId = query.message?.chat.id ?? query.from.id;
  const text = `<b>Головне меню</b>\n\n${helpText}`;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: mainKeyboard });
}

async function handleStatsCallback(env: Env, query: TelegramCallbackQuery): Promise<void> {
  if (!env.GROUP_APPLICATIONS) {
    await answerCallbackQuery(env, query.id, "Сховище не налаштоване");
    return;
  }
  await answerCallbackQuery(env, query.id);
  const text = await buildStatsText(env.GROUP_APPLICATIONS);
  const chatId = query.message?.chat.id ?? query.from.id;
  await sendAdminMessage(env, chatId, { text, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🏠 Меню", callback_data: "menu" }]] } });
}

async function handleMessage(env: Env, message: TelegramMessage): Promise<void> {
  const userId = message.from.id;
  if (!(await isAdmin(userId, env))) {
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
      await handleLast(env, message, args);
      break;
    case "list":
      await handleList(env, message, args);
      break;
    case "serving":
      await handleList(env, message, "serving");
      break;
    case "question":
    case "questions":
      await handleList(env, message, "question");
      break;
    case "search":
      await handleSearch(env, message, args);
      break;
    case "group":
      await handleGroup(env, message, args);
      break;
    case "groups":
      await handleGroups(env, message);
      break;
    case "stats":
      await handleStats(env, message);
      break;
    case "season":
      await handleSeason(env, message);
      break;
    case "admins":
      await handleAdmins(env, message);
      break;
    case "delete":
      await handleDeleteCommand(env, message, args);
      break;
    case "admin_add":
      await handleAdminAddCommand(env, message, args);
      break;
    case "admin_remove":
      await handleAdminRemoveCommand(env, message, args);
      break;
    default:
      await sendAdminMessage(env, message.chat.id, { text: "Невідома команда. Використайте /help." });
  }
}

async function handleCallback(env: Env, query: TelegramCallbackQuery): Promise<void> {
  const userId = query.from.id;
  if (!(await isAdmin(userId, env))) {
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
  const separator = data.indexOf(":");
  const prefix = separator === -1 ? data : data.slice(0, separator);
  const value = separator === -1 ? "" : data.slice(separator + 1);
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
    case "confirm_delete":
      await handleConfirmDeleteCallback(env, query, value);
      break;
    case "cancel_delete":
      await handleCancelDeleteCallback(env, query, value);
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
