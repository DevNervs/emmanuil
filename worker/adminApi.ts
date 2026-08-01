import {
  addAdmin,
  addLog,
  addTrashItem,
  archiveCurrentSeason,
  clearLogs,
  countApplications,
  countApplicationsByStatus,
  createAdminInvite,
  deleteSeason,
  getAdmins,
  getAdminProfiles,
  getApplication,
  getCurrentGroups,
  getCurrentSeason,
  getLogs,
  getOwner,
  getSeasons,
  getSiteConfig,
  findApplicationKey,
  listApplications,
  listTrash,
  permanentDeleteTrashItem,
  removeAdmin,
  removeAdminProfile,
  restoreTrashItem,
  setCurrentGroups,
  setSiteConfig,
  startNewSeason,
} from "./storage";
import { constantTimeCompare, cookie, getEffectiveAdminIds, json, signAdminSession, verifyAdminSession } from "./telegram";
import type { Env } from "./env";
import type { Group, GroupApplication, SiteConfig } from "./types";

function badRequest(message: string): Response {
  return json({ message }, 400);
}

function unauthorized(): Response {
  return json({ message: "Unauthorized" }, 401);
}

function tooManyRequests(): Response {
  return json({ message: "Too many attempts. Try again later." }, 429);
}

async function checkLoginRateLimit(request: Request, env: Env): Promise<boolean> {
  if (!env.GROUP_APPLICATIONS) return false;
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `rate-limit:login:${clientIp}`;
  const now = Math.floor(Date.now() / 1000);
  const stored = await env.GROUP_APPLICATIONS.get(key, "text");
  if (!stored) return false;
  try {
    const record = JSON.parse(stored) as { attempts?: number; resetAt?: number };
    if (Number(record.resetAt) > now && Number(record.attempts) >= 10) return true;
  } catch {
    /* ignore malformed data */
  }
  return false;
}

async function recordLoginAttempt(request: Request, env: Env, success: boolean): Promise<void> {
  if (!env.GROUP_APPLICATIONS) return;
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = `rate-limit:login:${clientIp}`;
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = 15 * 60;
  if (success) {
    await env.GROUP_APPLICATIONS.delete(key);
    return;
  }
  const stored = await env.GROUP_APPLICATIONS.get(key, "text");
  let attempts = 1;
  let resetAt = now + windowSeconds;
  if (stored) {
    try {
      const record = JSON.parse(stored) as { attempts?: number; resetAt?: number };
      if (Number(record.resetAt) > now) {
        attempts = Number(record.attempts) + 1;
        resetAt = Number(record.resetAt);
      }
    } catch {
      /* ignore */
    }
  }
  await env.GROUP_APPLICATIONS.put(key, JSON.stringify({ attempts, resetAt }), { expirationTtl: windowSeconds });
}

const ALLOWED_ADMIN_ORIGINS = new Set([
  "https://app.boris-reminder.workers.dev",
  "https://emmanuil.pages.dev",
  "https://new.emmanuil.cv.ua",
  "https://emmanuil.cv.ua",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const base = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-File-Name",
    Vary: "Origin",
  };
  if (!origin || !ALLOWED_ADMIN_ORIGINS.has(origin)) {
    return base;
  }
  return {
    ...base,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
  };
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request.headers.get("Origin"));
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

async function requireAuth(request: Request, env: Env): Promise<boolean> {
  return verifyAdminSession(request, env);
}

async function parseJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

async function csvExport(kv: KVNamespace, seasonId?: string, archive?: boolean): Promise<string> {
  const { apps } = await listApplications(kv, { limit: 10_000, seasonId, archive });
  const header = ["ID", "Name", "Phone", "Groups", "Date", "Season", "Status"].join(",") + "\n";
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = apps.map((app) => [
    app.id,
    escape(app.name),
    escape(app.phone),
    escape(app.groupNames.join("; ")),
    new Date(app.createdAt).toISOString(),
    app.seasonId,
    app.status ?? "new",
  ].join(","));
  return header + rows.join("\n");
}

async function getBotUsername(env: Env): Promise<string | null> {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    if (!response.ok) return null;
    const data = await response.json() as { ok?: boolean; result?: { username?: string } };
    return data.ok && data.result?.username ? data.result.username : null;
  } catch {
    return null;
  }
}

export async function handleAdminApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), request);
  }

  if (pathname === "/admin/api/login") {
    if (request.method !== "POST") return withCors(json({ message: "Method not allowed" }, 405), request);
    if (await checkLoginRateLimit(request, env)) {
      return withCors(tooManyRequests(), request);
    }
    const body = await parseJson<{ password?: string }>(request);
    if (!body?.password || !env.ADMIN_PASSWORD || !constantTimeCompare(body.password, env.ADMIN_PASSWORD)) {
      await recordLoginAttempt(request, env, false);
      return withCors(json({ message: "Invalid password" }, 401), request);
    }
    await recordLoginAttempt(request, env, true);
    if (!env.ADMIN_SESSION_SECRET) return withCors(json({ message: "Session secret not configured" }, 503), request);
    const token = await signAdminSession(env.ADMIN_PASSWORD, env.ADMIN_SESSION_SECRET);
    const headers = new Headers();
    headers.set("Set-Cookie", cookie("admin-session", token, {
      path: "/",
      maxAge: 86400 * 7,
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    }));
    headers.set("Content-Type", "application/json; charset=utf-8");
    return withCors(new Response(JSON.stringify({ ok: true }), { headers }), request);
  }

  const isAuthorized = await requireAuth(request, env);
  if (!isAuthorized) return withCors(unauthorized(), request);

  if (pathname === "/admin/api/logout") {
    if (request.method !== "POST") return withCors(json({ message: "Method not allowed" }, 405), request);
    const headers = new Headers();
    headers.set("Set-Cookie", cookie("admin-session", "", { path: "/", maxAge: 0, httpOnly: true, secure: true, sameSite: "Strict" }));
    headers.set("Content-Type", "application/json; charset=utf-8");
    return withCors(new Response(JSON.stringify({ ok: true }), { headers }), request);
  }

  if (!env.GROUP_APPLICATIONS) return withCors(json({ message: "KV not configured" }, 503), request);
  const kv = env.GROUP_APPLICATIONS;

  if (pathname === "/admin/api/me") {
    return withCors(json({ ok: true }), request);
  }

  if (pathname === "/admin/api/dashboard") {
    if (request.method !== "GET") {
      return withCors(json({ message: "Method not allowed" }, 405), request);
    }
    const [groups, applicationCount, newApplicationCount, adminIds] = await Promise.all([
      getCurrentGroups(kv),
      countApplications(kv),
      countApplicationsByStatus(kv, "new"),
      getEffectiveAdminIds(env),
    ]);
    return withCors(json({
      groupCount: groups.length,
      applicationCount,
      newApplicationCount,
      adminCount: adminIds.length,
      updatedAt: Date.now(),
    }), request);
  }

  if (pathname === "/admin/api/groups") {
    if (request.method === "GET") {
      const groups = await getCurrentGroups(kv);
      return withCors(json({ groups }), request);
    }
    if (request.method === "PUT") {
      const body = await parseJson<{ groups?: Group[] }>(request);
      if (!body?.groups || !Array.isArray(body.groups)) return withCors(badRequest("Invalid groups"), request);
      const groups = body.groups.map((g, i) => ({
        id: g.id ?? i + 1,
        title: (g.title ?? "").trim(),
        leaders: (g.leaders ?? "").trim(),
        description: (g.description ?? "").trim(),
        time: (g.time ?? "").trim(),
        day: (g.day ?? "").trim(),
        address: (g.address ?? "").trim(),
        coordinates: (g.coordinates ?? "").trim(),
      })).filter((g) => g.title);
      await setCurrentGroups(kv, groups);
      await addLog(kv, "groups_updated", `${groups.length} груп`);
      return withCors(json({ groups }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/promo-video") {
    if (request.method !== "POST") {
      return withCors(json({ message: "Method not allowed" }, 405), request);
    }
    const contentType = request.headers.get("Content-Type")?.split(";")[0].trim() || "";
    const allowedTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
    if (!allowedTypes.has(contentType)) {
      return withCors(badRequest("Оберіть відеофайл MP4, WebM або MOV."), request);
    }
    const declaredSize = Number(request.headers.get("Content-Length") || 0);
    const maxSize = 20 * 1024 * 1024;
    if (declaredSize > maxSize) {
      return withCors(json({ message: "Відео має бути не більше 20 МБ." }, 413), request);
    }
    const value = await request.arrayBuffer();
    if (!value.byteLength || value.byteLength > maxSize) {
      return withCors(json({ message: "Відео має бути не більше 20 МБ." }, 413), request);
    }
    const id = crypto.randomUUID();
    const encodedName = request.headers.get("X-File-Name") || "";
    let filename = "video";
    try {
      filename = decodeURIComponent(encodedName).slice(0, 180) || filename;
    } catch {
      // Keep the safe fallback name.
    }
    await kv.put(`promo-video:${id}`, value, {
      metadata: { contentType, filename, size: value.byteLength, uploadedAt: Date.now() },
    });
    await kv.put(
      `promo-video-meta:${id}`,
      JSON.stringify({ contentType, filename, size: value.byteLength, uploadedAt: Date.now() }),
    );
    await addLog(kv, "promo_video_uploaded", filename);
    return withCors(json({ url: `/media/admin-promo-video/${id}`, filename, size: value.byteLength }), request);
  }

  if (pathname === "/admin/api/seasons") {
    if (request.method === "GET") {
      const current = await getCurrentSeason(kv);
      const seasons = await getSeasons(kv);
      return withCors(json({ current, seasons }), request);
    }
    if (request.method === "POST") {
      const body = await parseJson<{ name?: string; groups?: Group[] }>(request);
      if (!body?.name) return withCors(badRequest("Season name required"), request);
      const season = await startNewSeason(kv, body.name, body.groups);
      await addLog(kv, "season_created", season.name);
      return withCors(json({ season }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  const seasonIdMatch = pathname.match(/^\/admin\/api\/seasons\/([^/]+)$/);
  if (seasonIdMatch) {
    const seasonId = decodeURIComponent(seasonIdMatch[1]);
    if (request.method === "DELETE") {
      const seasons = await getSeasons(kv);
      const season = seasons.find((s) => s.id === seasonId);
      if (season) {
        const { apps } = await listApplications(kv, { seasonId, archive: true, limit: 10_000 });
        const archivedGroups = await kv.get(`groups:${seasonId}`).then((v) => v ? JSON.parse(v) as Group[] : []);
        const appRecords = apps.map((app) => ({
          key: `archive:${seasonId}:${String(app.createdAt).padStart(13, "0")}:${app.id}`,
          app,
        }));
        await addTrashItem(kv, "season", season.name, { season, apps: appRecords, groups: archivedGroups });
        await addLog(kv, "season_deleted", season.name);
        await deleteSeason(kv, seasonId);
      }
      return withCors(json({ ok: true }), request);
    }
    if (request.method === "GET") {
      const { apps } = await listApplications(kv, { seasonId, archive: true, limit: 10_000 });
      const archivedGroups = await kv.get(`groups:${seasonId}`).then((v) => v ? JSON.parse(v) as Group[] : []);
      return withCors(json({ apps, groups: archivedGroups }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/seasons/archive") {
    if (request.method !== "POST") return withCors(json({ message: "Method not allowed" }, 405), request);
    const current = await getCurrentSeason(kv);
    const archived = await archiveCurrentSeason(kv);
    if (current) await addLog(kv, "season_archived", current.name);
    return withCors(json({ archived }), request);
  }

  if (pathname === "/admin/api/applications") {
    const searchParams = url.searchParams;
    const offset = Number(searchParams.get("offset") ?? 0);
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
    const seasonId = searchParams.get("seasonId") ?? undefined;
    const archive = searchParams.get("archive") === "true";
    if (request.method === "GET") {
      const result = await listApplications(kv, { offset, limit, seasonId, archive });
      return withCors(json(result), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  const appIdMatch = pathname.match(/^\/admin\/api\/applications\/([^/]+)$/);
  if (appIdMatch) {
    const appId = decodeURIComponent(appIdMatch[1]);
    if (request.method === "GET") {
      const app = await getApplication(kv, appId, true);
      if (!app) return withCors(json({ message: "Not found" }, 404), request);
      return withCors(json({ app }), request);
    }
    if (request.method === "DELETE") {
      const app = await getApplication(kv, appId, true);
      const key = await findApplicationKey(kv, appId, true);
      if (app && key) {
        await addTrashItem(kv, "application", `${app.name} (${app.phone})`, app, undefined, key);
        await addLog(kv, "application_deleted", `${app.name} (${app.phone})`);
        await kv.delete(key);
      }
      return withCors(json({ ok: true }), request);
    }
    if (request.method === "PUT") {
      const body = await parseJson<Partial<GroupApplication>>(request);
      const app = await getApplication(kv, appId, true);
      if (!app) return withCors(json({ message: "Not found" }, 404), request);
      if (body?.status && ["new", "in_progress", "done"].includes(body.status)) {
        app.status = body.status;
        await addLog(kv, "application_status_updated", `${app.name} → ${body.status}`);
      }
      const key = await findApplicationKey(kv, appId, true);
      if (key) await kv.put(key, JSON.stringify(app));
      return withCors(json({ app }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/admins") {
    if (request.method === "GET") {
      const [admins, effectiveAdmins, profiles, owner] = await Promise.all([
        getAdmins(kv),
        getEffectiveAdminIds(env),
        getAdminProfiles(kv),
        getOwner(kv),
      ]);
      const configuredAdmins = effectiveAdmins.filter((id) => !admins.includes(id));
      return withCors(json({ admins, configuredAdmins, profiles, owner }), request);
    }
    if (request.method === "POST") {
      const body = await parseJson<{ userId?: number }>(request);
      if (!body?.userId || !Number.isInteger(body.userId)) return withCors(badRequest("Invalid userId"), request);
      await addAdmin(kv, body.userId);
      await addLog(kv, "admin_added", `ID: ${body.userId}`);
      return withCors(json({ admins: await getAdmins(kv) }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/admin-invites") {
    if (request.method !== "POST") {
      return withCors(json({ message: "Method not allowed" }, 405), request);
    }
    const body = await parseJson<{ username?: string }>(request);
    const username = body?.username?.trim().replace(/^@/, "") || "";
    if (username && !/^[A-Za-z0-9_]{5,32}$/.test(username)) {
      return withCors(badRequest("Вкажіть коректний Telegram username."), request);
    }
    const botUsername = await getBotUsername(env);
    if (!botUsername) {
      return withCors(json({ message: "Не вдалося отримати адресу Telegram-бота." }, 503), request);
    }
    const invite = await createAdminInvite(kv, username || undefined);
    const link = `https://t.me/${botUsername}?start=admin_${invite.token}`;
    await addLog(kv, "admin_invite_created", username ? `@${username}` : "без username");
    return withCors(json({
      link,
      username: invite.username || null,
      expiresAt: invite.expiresAt,
    }), request);
  }

  if (pathname === "/admin/api/owner-invite") {
    if (request.method !== "POST") {
      return withCors(json({ message: "Method not allowed" }, 405), request);
    }
    if (await getOwner(kv)) {
      return withCors(json({ message: "Власника вже призначено." }, 409), request);
    }
    const body = await parseJson<{ username?: string }>(request);
    const username = body?.username?.trim().replace(/^@/, "") || "";
    if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) {
      return withCors(badRequest("Вкажіть коректний Telegram username."), request);
    }
    const botUsername = await getBotUsername(env);
    if (!botUsername) {
      return withCors(json({ message: "Не вдалося отримати адресу Telegram-бота." }, 503), request);
    }
    const invite = await createAdminInvite(kv, username, 48 * 60 * 60 * 1000, "owner");
    const link = `https://t.me/${botUsername}?start=admin_${invite.token}`;
    await addLog(kv, "owner_invite_created", `@${username}`);
    return withCors(json({ link, username: invite.username, expiresAt: invite.expiresAt }), request);
  }

  const adminIdMatch = pathname.match(/^\/admin\/api\/admins\/([^/]+)$/);
  if (adminIdMatch) {
    const userId = Number(decodeURIComponent(adminIdMatch[1]));
    if (!Number.isInteger(userId)) return withCors(badRequest("Invalid userId"), request);
    if (request.method === "DELETE") {
      const owner = await getOwner(kv);
      if (owner?.userId === userId) {
        return withCors(json({ message: "Власника не можна видалити." }, 409), request);
      }
      const profiles = await getAdminProfiles(kv);
      const profile = profiles.find((p) => p.userId === userId);
      await addTrashItem(kv, "admin", profile ? `@${profile.username || userId}` : `ID: ${userId}`, { userId, profile });
      await removeAdmin(kv, userId);
      await removeAdminProfile(kv, userId);
      await addLog(kv, "admin_removed", `ID: ${userId}`);
      return withCors(json({ admins: await getAdmins(kv) }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/logs") {
    if (request.method === "GET") {
      const logs = await getLogs(kv, 50);
      return withCors(json({ logs }), request);
    }
    if (request.method === "DELETE") {
      await clearLogs(kv);
      await addLog(kv, "logs_cleared");
      return withCors(json({ ok: true }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/site") {
    if (request.method === "GET") {
      const config = await getSiteConfig(kv);
      return withCors(json(config), request);
    }
    if (request.method === "PUT") {
      const body = await parseJson<SiteConfig>(request);
      if (!body) return withCors(badRequest("Invalid config"), request);
      const previous = await getSiteConfig(kv);
      await setSiteConfig(kv, body);
      const previousVideoId = previous.promo?.videoUrl?.match(/^\/media\/admin-promo-video\/([a-f0-9-]+)$/)?.[1];
      const nextVideoId = body.promo?.videoUrl?.match(/^\/media\/admin-promo-video\/([a-f0-9-]+)$/)?.[1];
      if (previousVideoId && previousVideoId !== nextVideoId) {
        const videoValue = await kv.get(`promo-video:${previousVideoId}`, "arrayBuffer");
        const metaValue = await kv.get(`promo-video-meta:${previousVideoId}`);
        const meta = metaValue ? (JSON.parse(metaValue) as Record<string, unknown>) : undefined;
        if (videoValue && meta) {
          await addTrashItem(kv, "promo-video", meta.filename as string || previousVideoId, { videoId: previousVideoId, meta }, videoValue);
          await addLog(kv, "promo_video_deleted", meta.filename as string || previousVideoId);
        }
        await kv.delete(`promo-video:${previousVideoId}`);
        await kv.delete(`promo-video-meta:${previousVideoId}`);
      }
      await addLog(kv, "site_config_updated");
      return withCors(json({ ok: true }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/trash") {
    if (request.method === "GET") {
      const items = await listTrash(kv, 100);
      return withCors(json({ items }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  const trashIdMatch = pathname.match(/^\/admin\/api\/trash\/([^/]+)$/);
  if (trashIdMatch) {
    const trashId = decodeURIComponent(trashIdMatch[1]);
    if (request.method === "DELETE") {
      await permanentDeleteTrashItem(kv, trashId);
      await addLog(kv, "trash_deleted", trashId);
      return withCors(json({ ok: true }), request);
    }
    if (request.method === "POST") {
      const restored = await restoreTrashItem(kv, trashId);
      if (!restored) return withCors(json({ message: "Not found" }, 404), request);
      await addLog(kv, "trash_restored", trashId);
      return withCors(json({ ok: true }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/export") {
    const searchParams = url.searchParams;
    const seasonId = searchParams.get("seasonId") ?? undefined;
    const archive = searchParams.get("archive") === "true";
    const csv = await csvExport(kv, seasonId, archive);
    return withCors(new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=applications.csv",
      },
    }), request);
  }

  return withCors(json({ message: "Not found" }, 404), request);
}
