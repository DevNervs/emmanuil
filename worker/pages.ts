import { handleAdminApi } from "./adminApi";
import { handleGroupRegistration } from "./groupRegistration";
import { handleGroupsApi } from "./apiGroups";
import { handleSiteApi } from "./apiSite";
import { json } from "./telegram";
import { handleTelegramWebhook, setupTelegramWebhook } from "./telegramBot";
import type { Env } from "./env";
import { handleYouTubeLive } from "./youtubeLive";

const legacyRedirects: Record<string, string> = {
  "/about-us": "/about",
  "/about-us/team": "/team",
  "/about-us/mi-virimo": "/about#beliefs",
  "/about-us/virovchennja-chve": "/virovchennja",
  "/live": "/online",
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;

    const legacyTarget = legacyRedirects[pathname];
    if (legacyTarget) {
      const target = new URL(legacyTarget, url.origin);
      target.search = url.search;
      return Response.redirect(target, 301);
    }

    if (pathname === "/api/group-registration") return handleGroupRegistration(request, env);
    if (pathname === "/api/youtube-live") return handleYouTubeLive(request);
    if (pathname === "/api/telegram") return handleTelegramWebhook(request, env);
    if (pathname === "/api/setup-telegram") return setupTelegramWebhook(request, env);
    if (pathname === "/api/groups") return handleGroupsApi(request, env);
    if (pathname === "/api/site") return handleSiteApi(request, env);
    if (pathname.startsWith("/admin/api/")) return handleAdminApi(request, env);

    if (!env.ASSETS) return json({ message: "ASSETS binding not configured" }, 503);
    return env.ASSETS.fetch(request);
  },
};

export default worker;
