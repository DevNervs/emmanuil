import { handleAdminApi } from "./adminApi";
import { handleGroupRegistration } from "./groupRegistration";
import { handleGroupsApi } from "./apiGroups";
import { handleSiteApi } from "./apiSite";
import { json } from "./telegram";
import { handleTelegramWebhook, setupTelegramWebhook } from "./telegramBot";
import type { Env } from "./env";
import { handleYouTubeLive } from "./youtubeLive";
import { handlePromoVideo } from "./promoVideo";
import { redirectToHttps, withSecurityHeaders } from "./securityHeaders";

const legacyRedirects: Record<string, string> = {
  "/about-us": "/about/",
  "/about-us/team": "/team/",
  "/about-us/mi-virimo": "/about/#beliefs",
  "/about-us/virovchennja-chve": "/virovchennja/",
  "/live": "/online/",
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const httpsRedirect = redirectToHttps(request);
    if (httpsRedirect) return httpsRedirect;

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
    const promoVideoMatch = pathname.match(/^\/media\/admin-promo-video\/([a-f0-9-]+)$/);
    if (promoVideoMatch) return handlePromoVideo(request, env, promoVideoMatch[1]);

    if (!env.ASSETS) return json({ message: "ASSETS binding not configured" }, 503);

    const staticAssetPattern = /^\/(?:_next|media|fonts)\/|\.\w{2,6}$/;
    if (staticAssetPattern.test(pathname)) return env.ASSETS.fetch(request);

    const publicRoutes = new Set([
      "/", "/about", "/contacts", "/visit", "/groups", "/online",
      "/team", "/europe", "/departments", "/donate", "/privacy",
      "/virovchennja", "/admin", "/404",
    ]);
    if (!publicRoutes.has(pathname)) {
      const notFound = await env.ASSETS.fetch(new Request(new URL("/404/", request.url)));
      return withSecurityHeaders(
        new Response(notFound.body, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }),
        { isHtml: true },
      );
    }

    const page = await env.ASSETS.fetch(request);
    const contentType = page.headers.get("Content-Type") || "";
    return withSecurityHeaders(page, { isHtml: contentType.includes("text/html") });
  },
};

export default worker;
