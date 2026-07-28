import type { Env } from "./env";

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function sendTelegramMessage(
  env: Env,
  payload: Record<string, unknown>,
): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ message: "Telegram bot token not configured" }, 503);
  }
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function answerCallbackQuery(
  env: Env,
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export function isAdmin(userId: number, env: Env): boolean {
  if (env.TELEGRAM_ADMIN_USER_IDS) {
    const ids = env.TELEGRAM_ADMIN_USER_IDS.split(",").map((id) => Number(id.trim())).filter(Boolean);
    if (ids.includes(userId)) return true;
  }
  if (env.TELEGRAM_ADMIN_CHAT_ID) {
    return Number(env.TELEGRAM_ADMIN_CHAT_ID) === userId;
  }
  return false;
}

export function verifyWebhookSecret(request: Request, env: Env): boolean {
  if (!env.TELEGRAM_WEBHOOK_SECRET) return true;
  const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  return header === env.TELEGRAM_WEBHOOK_SECRET;
}
