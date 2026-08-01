import type { Env } from "./env";
import { getAdmins, getOwner } from "./storage";

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function cookie(
  name: string,
  value: string,
  options: Record<string, string | number | boolean> = {},
): string {
  const pairs = [`${name}=${value}`];
  if (options.maxAge !== undefined) pairs.push(`Max-Age=${options.maxAge}`);
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

export async function getEffectiveAdminIds(env: Env): Promise<number[]> {
  const ids = new Set<number>();
  if (env.GROUP_APPLICATIONS) {
    try {
      for (const id of await getAdmins(env.GROUP_APPLICATIONS)) {
        if (Number.isInteger(id) && id > 0) ids.add(id);
      }
      const owner = await getOwner(env.GROUP_APPLICATIONS);
      if (owner && Number.isInteger(owner.userId) && owner.userId > 0) ids.add(owner.userId);
    } catch (error) {
      console.error("Failed to read admins:", error);
    }
  }
  for (const raw of (env.TELEGRAM_ADMIN_USER_IDS || "").split(",")) {
    const id = Number(raw.trim());
    if (Number.isInteger(id) && id > 0) ids.add(id);
  }
  const primaryId = Number(env.TELEGRAM_ADMIN_CHAT_ID);
  if (Number.isInteger(primaryId) && primaryId > 0) ids.add(primaryId);
  return [...ids];
}

export function verifyWebhookSecret(request: Request, env: Env): boolean {
  if (!env.TELEGRAM_WEBHOOK_SECRET) return true;
  const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  return header === env.TELEGRAM_WEBHOOK_SECRET;
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256(keyData: BufferSource, data: BufferSource): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return [...new Uint8Array(signature as unknown as ArrayBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signAdminSession(password: string, secret: string, maxAge = 604800): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const encoder = new TextEncoder();
  const data = encoder.encode(`admin:${password}:${expiresAt}`);
  const digest = await hmacSha256(encoder.encode(secret), data);
  return `${expiresAt}:${digest}`;
}

export async function verifyAdminSession(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return false;
  const cookies = parseCookies(request.headers.get("Cookie"));
  const token = cookies["admin-session"];
  if (!token) return false;

  const [expiresAtStr, sig] = token.split(":");
  if (!expiresAtStr || !sig) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt <= now) return false;

  const expected = await signAdminSession(env.ADMIN_PASSWORD, env.ADMIN_SESSION_SECRET, expiresAt - now);
  return constantTimeCompare(token, expected);
}
