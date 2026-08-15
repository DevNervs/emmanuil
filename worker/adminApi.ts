import {
  addAdmin,
  addLog,
  applicationType,
  archiveCurrentSeason,
  clearLogs,
  deleteApplication,
  deleteSeason,
  findApplicationKey,
  getAdmins,
  getApplication,
  getCurrentGroups,
  getCurrentSeason,
  getLogs,
  getSeasons,
  getServings,
  getSiteConfig,
  listApplications,
  removeAdmin,
  setCurrentGroups,
  setServings,
  setSiteConfig,
  startNewSeason,
} from "./storage";
import { cookie, json, signAdminSession, verifyAdminSession } from "./telegram";
import type { Env } from "./env";
import type { ApplicationType, Group, GroupApplication, Serving, SiteConfig } from "./types";

function parseApplicationType(value: string | null): ApplicationType | undefined {
  if (value === "group" || value === "serving" || value === "question") return value;
  return undefined;
}

function applicationDetails(app: GroupApplication): string {
  const type = applicationType(app);
  if (type === "serving") return [app.serving, app.message].filter(Boolean).join(" · ");
  if (type === "question") return [app.message, app.email].filter(Boolean).join(" · ");
  return app.groupNames.join("; ");
}

function badRequest(message: string): Response {
  return json({ message }, 400);
}

function unauthorized(): Response {
  return json({ message: "Unauthorized" }, 401);
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

const TYPE_LABELS: Record<ApplicationType, string> = {
  group: "Домашня група",
  serving: "Служіння",
  question: "Питання",
};

async function csvExport(kv: KVNamespace, seasonId?: string, archive?: boolean, type?: ApplicationType): Promise<string> {
  const { apps } = await listApplications(kv, { limit: 10_000, seasonId, archive, type });
  const header = ["ID", "Type", "Name", "Phone", "Email", "Details", "Date", "Season", "Status"].join(",") + "\n";
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = apps.map((app) => [
    app.id,
    TYPE_LABELS[applicationType(app)],
    escape(app.name),
    escape(app.phone),
    escape(app.email ?? ""),
    escape(applicationDetails(app)),
    new Date(app.createdAt).toISOString(),
    app.seasonId,
    app.status ?? "new",
  ].join(","));
  return header + rows.join("\n");
}

export async function handleAdminApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }), request);
  }

  if (pathname === "/admin/api/login") {
    if (request.method !== "POST") return withCors(json({ message: "Method not allowed" }, 405), request);
    const body = await parseJson<{ password?: string }>(request);
    if (!body?.password || body.password !== env.ADMIN_PASSWORD) {
      return withCors(json({ message: "Invalid password" }, 401), request);
    }
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

  if (pathname === "/admin/api/logout") {
    const headers = new Headers();
    headers.set("Set-Cookie", cookie("admin-session", "", { path: "/", maxAge: 0 }));
    headers.set("Content-Type", "application/json; charset=utf-8");
    return withCors(new Response(JSON.stringify({ ok: true }), { headers }), request);
  }

  const isAuthorized = await requireAuth(request, env);
  if (!isAuthorized) return withCors(unauthorized(), request);

  if (!env.GROUP_APPLICATIONS) return withCors(json({ message: "KV not configured" }, 503), request);
  const kv = env.GROUP_APPLICATIONS;

  if (pathname === "/admin/api/me") {
    return withCors(json({ ok: true }), request);
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
        showOnHome: Boolean(g.showOnHome),
      })).filter((g) => g.title);
      await setCurrentGroups(kv, groups);
      await addLog(kv, "groups_updated", `${groups.length} груп`);
      return withCors(json({ groups }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
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
      return withCors(json({ season }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/seasons/archive") {
    if (request.method !== "POST") return withCors(json({ message: "Method not allowed" }, 405), request);
    const archived = await archiveCurrentSeason(kv);
    return withCors(json({ archived }), request);
  }

  const seasonIdMatch = pathname.match(/^\/admin\/api\/seasons\/([^/]+)$/);
  if (seasonIdMatch) {
    const seasonId = decodeURIComponent(seasonIdMatch[1]);
    if (request.method === "DELETE") {
      await deleteSeason(kv, seasonId);
      return withCors(json({ ok: true }), request);
    }
    if (request.method === "GET") {
      const { apps } = await listApplications(kv, { seasonId, archive: true, limit: 10_000 });
      const archivedGroups = await kv.get(`groups:${seasonId}`).then((v) => v ? JSON.parse(v) as Group[] : []);
      return withCors(json({ apps, groups: archivedGroups }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/applications") {
    const searchParams = url.searchParams;
    const offset = Number(searchParams.get("offset") ?? 0);
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
    const seasonId = searchParams.get("seasonId") ?? undefined;
    const archive = searchParams.get("archive") === "true";
    const type = parseApplicationType(searchParams.get("type"));
    if (request.method === "GET") {
      const result = await listApplications(kv, { offset, limit, seasonId, archive, type });
      return withCors(json(result), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/stats") {
    if (request.method !== "GET") return withCors(json({ message: "Method not allowed" }, 405), request);
    const { apps } = await listApplications(kv, { limit: 10_000 });
    const byType: Record<ApplicationType, number> = { group: 0, serving: 0, question: 0 };
    for (const app of apps) {
      byType[applicationType(app)] += 1;
    }
    return withCors(json({ total: apps.length, byType }), request);
  }

  if (pathname === "/admin/api/servings") {
    if (request.method === "GET") {
      const servings = await getServings(kv);
      return withCors(json({ servings }), request);
    }
    if (request.method === "PUT") {
      const body = await parseJson<{ servings?: Serving[] }>(request);
      if (!body?.servings || !Array.isArray(body.servings)) return withCors(badRequest("Invalid servings"), request);
      const servings = body.servings.map((s, i) => ({
        id: Number.isInteger(s.id) ? s.id : i + 1,
        title: (s.title ?? "").trim(),
        description: (s.description ?? "").trim(),
      })).filter((s) => s.title);
      await setServings(kv, servings);
      await addLog(kv, "servings_updated", `${servings.length} служінь`);
      return withCors(json({ servings }), request);
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
      await deleteApplication(kv, appId, true);
      return withCors(json({ ok: true }), request);
    }
    if (request.method === "PUT") {
      const body = await parseJson<Partial<GroupApplication>>(request);
      const app = await getApplication(kv, appId, true);
      if (!app) return withCors(json({ message: "Not found" }, 404), request);
      if (body?.status && ["new", "in_progress", "done"].includes(body.status)) {
        app.status = body.status;
      }
      const key = await findApplicationKey(kv, appId, true);
      if (key) await kv.put(key, JSON.stringify(app));
      return withCors(json({ app }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/admins") {
    if (request.method === "GET") {
      const admins = await getAdmins(kv);
      return withCors(json({ admins }), request);
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

  const adminIdMatch = pathname.match(/^\/admin\/api\/admins\/([^/]+)$/);
  if (adminIdMatch) {
    const userId = Number(decodeURIComponent(adminIdMatch[1]));
    if (!Number.isInteger(userId)) return withCors(badRequest("Invalid userId"), request);
    if (request.method === "DELETE") {
      await removeAdmin(kv, userId);
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
      await setSiteConfig(kv, body);
      await addLog(kv, "site_config_updated");
      return withCors(json({ ok: true }), request);
    }
    return withCors(json({ message: "Method not allowed" }, 405), request);
  }

  if (pathname === "/admin/api/export") {
    const searchParams = url.searchParams;
    const seasonId = searchParams.get("seasonId") ?? undefined;
    const archive = searchParams.get("archive") === "true";
    const type = parseApplicationType(searchParams.get("type"));
    const csv = await csvExport(kv, seasonId, archive, type);
    return withCors(new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=applications.csv",
      },
    }), request);
  }

  return withCors(json({ message: "Not found" }, 404), request);
}
