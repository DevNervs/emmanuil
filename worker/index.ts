import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handleAdminApi } from "./adminApi";
import { handleGroupRegistration } from "./groupRegistration";
import { handleGroupsApi } from "./apiGroups";
import { handleSiteApi } from "./apiSite";
import { handleTelegramWebhook, setupTelegramWebhook } from "./telegramBot";
import { handleYouTubeLive } from "./youtubeLive";
import { handlePromoVideo } from "./promoVideo";
import { redirectToHttps, withSecurityHeaders } from "./securityHeaders";
import type { Env } from "./env";

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type RouteHandler = (request: Request, env: Env, ctx: ExecutionContext, url: URL) => Response | Promise<Response>;

const LEGACY_REDIRECTS: Record<string, string> = {
  "/about-us": "/about",
  "/about-us/team": "/team",
  "/about-us/mi-virimo": "/about#beliefs",
  "/about-us/virovchennja-chve": "/virovchennja",
  "/live": "/online",
};

function handleVinextImage(request: Request, env: Env) {
  const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
  return handleImageOptimization(request, {
    fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
    transformImage: async (body, { width, format, quality }) => {
      const result = await env.IMAGES!.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
      return result.response();
    },
  }, allowedWidths);
}

const routes: { match: (pathname: string) => boolean; handler: RouteHandler }[] = [
  {
    match: (pathname) => pathname === "/api/group-registration",
    handler: (request, env) => handleGroupRegistration(request, env),
  },
  {
    match: (pathname) => pathname === "/api/youtube-live",
    handler: (request) => handleYouTubeLive(request),
  },
  {
    match: (pathname) => pathname === "/api/telegram",
    handler: (request, env) => handleTelegramWebhook(request, env),
  },
  {
    match: (pathname) => pathname === "/api/setup-telegram",
    handler: (request, env) => setupTelegramWebhook(request, env),
  },
  {
    match: (pathname) => pathname === "/api/groups",
    handler: (request, env) => handleGroupsApi(request, env),
  },
  {
    match: (pathname) => pathname === "/api/site",
    handler: (request, env) => handleSiteApi(request, env),
  },
  {
    match: (pathname) => pathname.startsWith("/admin/api/"),
    handler: (request, env) => handleAdminApi(request, env),
  },
  {
    match: (pathname) => /^\/media\/admin-promo-video\/[a-f0-9-]+$/.test(pathname),
    handler: (request, env, _ctx, url) =>
      handlePromoVideo(request, env, url.pathname.split("/").at(-1) || ""),
  },
  {
    match: (pathname) => pathname === "/_vinext/image",
    handler: (request, env) => handleVinextImage(request, env),
  },
];

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const httpsRedirect = redirectToHttps(request);
    if (httpsRedirect) return httpsRedirect;

    const url = new URL(request.url);
    const normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
    const legacyTarget = LEGACY_REDIRECTS[normalizedPath];

    if (legacyTarget) {
      const target = new URL(legacyTarget, url.origin);
      target.search = url.search;
      return Response.redirect(target, 301);
    }

    for (const route of routes) {
      if (route.match(url.pathname)) {
        const response = await route.handler(request, env, ctx, url);
        const contentType = response.headers.get("Content-Type") || "";
        return withSecurityHeaders(response, { isHtml: contentType.includes("text/html") });
      }
    }

    const page = await handler.fetch(request, env, ctx);
    const contentType = page.headers.get("Content-Type") || "";
    return withSecurityHeaders(page, { isHtml: contentType.includes("text/html") });
  },
};

export default worker;
