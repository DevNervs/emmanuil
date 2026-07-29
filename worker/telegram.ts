import type { Env } from "./env";
import { getAdmins } from "./storage";

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function cookie(name: string, value: string, options: Record<string, string | number> = {}): string {
  const pairs = [`${name}=${value}`];
  if (options.maxAge) pairs.push(`Max-Age=${options.maxAge}`);
  if (options.path) pairs.push(`Path=${options.path}`);
  if (options.httpOnly) pairs.push("HttpOnly");
  if (options.secure) pairs.push("Secure");
  if (options.sameSite) pairs.push(`SameSite=${options.sameSite}`);
  return pairs.join("; ");
}

export function parseCookies(header: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name && rest.length) {
      result[name] = decodeURIComponent(rest.join("="));
    }
  }
  return result;
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

export async function isAdmin(userId: number, env: Env): Promise<boolean> {
  if (env.GROUP_APPLICATIONS) {
    try {
      const admins = await getAdmins(env.GROUP_APPLICATIONS);
      if (admins.includes(userId)) return true;
    } catch (error) {
      console.error("Failed to read admins:", error);
    }
  }
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

export async function signAdminSession(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`admin:${password}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyAdminSession(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return false;
  const cookies = parseCookies(request.headers.get("Cookie"));
  const expected = await signAdminSession(env.ADMIN_PASSWORD, env.ADMIN_SESSION_SECRET);
  return cookies["admin-session"] === expected;
}
