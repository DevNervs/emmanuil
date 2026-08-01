import type { Group, GroupApplication, Season, SiteConfig } from "./types";

const APP_PREFIX = "app:";
const ARCHIVE_PREFIX = "archive:";
const CONFIG_PREFIX = "config:";
const GROUPS_KEY = "groups:current";
const LOGS_KEY = `${CONFIG_PREFIX}logs`;

function appKey(app: GroupApplication): string {
  return `${APP_PREFIX}${String(app.createdAt).padStart(13, "0")}:${app.id}`;
}

export async function getAdmins(kv: KVNamespace): Promise<number[]> {
  const value = await kv.get(`${CONFIG_PREFIX}admins`);
  if (!value) return [];
  try {
    return JSON.parse(value) as number[];
  } catch {
    return [];
  }
}

export async function setAdmins(kv: KVNamespace, ids: number[]): Promise<void> {
  await kv.put(`${CONFIG_PREFIX}admins`, JSON.stringify(ids));
}

export async function addAdmin(kv: KVNamespace, id: number): Promise<void> {
  const admins = await getAdmins(kv);
  if (!admins.includes(id)) {
    admins.push(id);
    await setAdmins(kv, admins);
  }
}

export async function removeAdmin(kv: KVNamespace, id: number): Promise<void> {
  const admins = (await getAdmins(kv)).filter((adminId) => adminId !== id);
  await setAdmins(kv, admins);
}

export interface AdminProfile {
  userId: number;
  firstName?: string;
  username?: string;
  addedAt: number;
}

export interface AdminInvite {
  token: string;
  username?: string;
  role?: "admin" | "owner";
  createdAt: number;
  expiresAt: number;
}

const ADMIN_PROFILES_KEY = `${CONFIG_PREFIX}adminProfiles`;
const ADMIN_INVITE_PREFIX = `${CONFIG_PREFIX}adminInvite:`;
const OWNER_KEY = `${CONFIG_PREFIX}owner`;

export async function getOwner(kv: KVNamespace): Promise<AdminProfile | null> {
  const value = await kv.get(OWNER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AdminProfile;
  } catch {
    return null;
  }
}

export async function setOwner(kv: KVNamespace, owner: AdminProfile): Promise<void> {
  await kv.put(OWNER_KEY, JSON.stringify(owner));
}

export async function getAdminProfiles(kv: KVNamespace): Promise<AdminProfile[]> {
  const value = await kv.get(ADMIN_PROFILES_KEY);
  if (!value) return [];
  try {
    const profiles = JSON.parse(value) as AdminProfile[];
    return Array.isArray(profiles) ? profiles : [];
  } catch {
    return [];
  }
}

export async function saveAdminProfile(kv: KVNamespace, profile: AdminProfile): Promise<void> {
  const profiles = await getAdminProfiles(kv);
  const next = profiles.filter((item) => item.userId !== profile.userId);
  next.unshift(profile);
  await kv.put(ADMIN_PROFILES_KEY, JSON.stringify(next));
}

export async function removeAdminProfile(kv: KVNamespace, userId: number): Promise<void> {
  const profiles = (await getAdminProfiles(kv)).filter((profile) => profile.userId !== userId);
  await kv.put(ADMIN_PROFILES_KEY, JSON.stringify(profiles));
}

export async function createAdminInvite(
  kv: KVNamespace,
  username?: string,
  lifetimeMs = 48 * 60 * 60 * 1000,
  role: "admin" | "owner" = "admin",
): Promise<AdminInvite> {
  const token = crypto.randomUUID().replaceAll("-", "");
  const createdAt = Date.now();
  const invite: AdminInvite = {
    token,
    ...(username ? { username: username.replace(/^@/, "").toLowerCase() } : {}),
    role,
    createdAt,
    expiresAt: createdAt + lifetimeMs,
  };
  await kv.put(`${ADMIN_INVITE_PREFIX}${token}`, JSON.stringify(invite), {
    expirationTtl: Math.max(60, Math.ceil(lifetimeMs / 1000)),
  });
  return invite;
}

export async function getAdminInvite(kv: KVNamespace, token: string): Promise<AdminInvite | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const value = await kv.get(`${ADMIN_INVITE_PREFIX}${token}`);
  if (!value) return null;
  try {
    const invite = JSON.parse(value) as AdminInvite;
    if (invite.expiresAt <= Date.now()) {
      await kv.delete(`${ADMIN_INVITE_PREFIX}${token}`);
      return null;
    }
    return invite;
  } catch {
    return null;
  }
}

export async function consumeAdminInvite(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(`${ADMIN_INVITE_PREFIX}${token}`);
}

export async function getCurrentSeason(kv: KVNamespace): Promise<Season | null> {
  const value = await kv.get(`${CONFIG_PREFIX}currentSeason`);
  if (!value) return null;
  try {
    return JSON.parse(value) as Season;
  } catch {
    return null;
  }
}

export async function setCurrentSeason(kv: KVNamespace, season: Season | null): Promise<void> {
  if (season) {
    await kv.put(`${CONFIG_PREFIX}currentSeason`, JSON.stringify(season));
  } else {
    await kv.delete(`${CONFIG_PREFIX}currentSeason`);
  }
}

export async function getSeasons(kv: KVNamespace): Promise<Season[]> {
  const value = await kv.get(`${CONFIG_PREFIX}seasons`);
  if (!value) return [];
  try {
    return JSON.parse(value) as Season[];
  } catch {
    return [];
  }
}

export async function addSeason(kv: KVNamespace, season: Season): Promise<void> {
  const seasons = await getSeasons(kv);
  seasons.unshift(season);
  await kv.put(`${CONFIG_PREFIX}seasons`, JSON.stringify(seasons));
}

export async function updateSeason(kv: KVNamespace, season: Season): Promise<void> {
  const seasons = await getSeasons(kv);
  const index = seasons.findIndex((s) => s.id === season.id);
  if (index >= 0) {
    seasons[index] = season;
    await kv.put(`${CONFIG_PREFIX}seasons`, JSON.stringify(seasons));
  }
}

export async function getCurrentGroups(kv: KVNamespace): Promise<Group[]> {
  const value = await kv.get(GROUPS_KEY);
  if (!value) return [];
  try {
    return JSON.parse(value) as Group[];
  } catch {
    return [];
  }
}

export async function setCurrentGroups(kv: KVNamespace, groups: Group[]): Promise<void> {
  await kv.put(GROUPS_KEY, JSON.stringify(groups));
}

export async function getSiteConfig(kv: KVNamespace): Promise<SiteConfig> {
  const value = await kv.get(`${CONFIG_PREFIX}site`);
  if (!value) return {};
  try {
    return JSON.parse(value) as SiteConfig;
  } catch {
    return {};
  }
}

export async function setSiteConfig(kv: KVNamespace, config: SiteConfig): Promise<void> {
  await kv.put(`${CONFIG_PREFIX}site`, JSON.stringify(config));
}

export interface LogEntry {
  id: string;
  action: string;
  details?: string;
  timestamp: number;
}

const MAX_LOGS = 100;

export async function getLogs(kv: KVNamespace, limit = 50): Promise<LogEntry[]> {
  const value = await kv.get(LOGS_KEY);
  if (!value) return [];
  try {
    const logs = JSON.parse(value) as LogEntry[];
    return logs.slice(0, Math.max(1, limit));
  } catch {
    return [];
  }
}

export async function clearLogs(kv: KVNamespace): Promise<void> {
  await kv.delete(LOGS_KEY);
}

export async function addLog(
  kv: KVNamespace,
  action: string,
  details?: string,
): Promise<void> {
  const logs = await getLogs(kv, MAX_LOGS);
  logs.unshift({
    id: crypto.randomUUID(),
    action,
    details,
    timestamp: Date.now(),
  });
  await kv.put(LOGS_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
}

export async function saveApplication(
  kv: KVNamespace,
  app: GroupApplication,
): Promise<void> {
  await kv.put(appKey(app), JSON.stringify(app), {
    metadata: { id: app.id, createdAt: app.createdAt, seasonId: app.seasonId },
  });
}

export async function findApplicationKey(kv: KVNamespace, id: string, includeArchive: boolean): Promise<string | null> {
  let list = await kv.list<{ id: string }>({ prefix: APP_PREFIX });
  let key = list.keys.find((k) => k.metadata?.id === id) ?? list.keys.find((k) => k.name.endsWith(`:${id}`));
  if (key) return key.name;
  if (!includeArchive) return null;

  list = await kv.list<{ id: string }>({ prefix: ARCHIVE_PREFIX });
  key = list.keys.find((k) => k.metadata?.id === id) ?? list.keys.find((k) => k.name.endsWith(`:${id}`));
  return key?.name ?? null;
}

export async function getApplication(
  kv: KVNamespace,
  id: string,
  includeArchive = false,
): Promise<GroupApplication | null> {
  const key = await findApplicationKey(kv, id, includeArchive);
  if (!key) return null;
  const value = await kv.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as GroupApplication;
  } catch {
    return null;
  }
}

export async function deleteApplication(
  kv: KVNamespace,
  id: string,
  includeArchive = false,
): Promise<void> {
  const key = await findApplicationKey(kv, id, includeArchive);
  if (key) await kv.delete(key);
}

interface ListOptions {
  offset?: number;
  limit?: number;
  seasonId?: string;
  archive?: boolean;
}

async function getAllApplications(kv: KVNamespace, options: ListOptions = {}): Promise<GroupApplication[]> {
  let prefix = APP_PREFIX;
  if (options.archive && options.seasonId) {
    prefix = `${ARCHIVE_PREFIX}${options.seasonId}:`;
  } else if (options.archive) {
    prefix = ARCHIVE_PREFIX;
  }

  const apps: GroupApplication[] = [];
  let cursor: string | undefined;
  do {
    const list = await kv.list<Record<string, unknown>>({ prefix, cursor });
    const values = await Promise.all(list.keys.map((key) => kv.get(key.name)));
    for (const value of values) {
      if (!value) continue;
      try {
        const app = JSON.parse(value) as GroupApplication;
        if (options.seasonId && !options.archive && app.seasonId !== options.seasonId) continue;
        apps.push(app);
      } catch {
        // ignore invalid entries
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return apps.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listApplications(
  kv: KVNamespace,
  options: ListOptions = {},
): Promise<{ apps: GroupApplication[]; total: number }> {
  const all = await getAllApplications(kv, options);
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 10;
  return { apps: all.slice(offset, offset + limit), total: all.length };
}

export async function searchApplications(
  kv: KVNamespace,
  query: string,
  options: ListOptions = {},
): Promise<GroupApplication[]> {
  const lower = query.toLowerCase();
  const all = await getAllApplications(kv, options);
  return all.filter((app) =>
    app.name.toLowerCase().includes(lower) ||
    app.phone.toLowerCase().includes(lower) ||
    app.groupNames.some((name) => name.toLowerCase().includes(lower)),
  );
}

export async function filterApplicationsByGroup(
  kv: KVNamespace,
  groupIndex: number,
  options: ListOptions = {},
): Promise<GroupApplication[]> {
  const all = await getAllApplications(kv, options);
  return all.filter((app) => app.groups.includes(groupIndex));
}

export async function countApplications(kv: KVNamespace, options: ListOptions = {}): Promise<number> {
  const all = await getAllApplications(kv, options);
  return all.length;
}

export async function countApplicationsByStatus(
  kv: KVNamespace,
  status: NonNullable<GroupApplication["status"]> | "new",
  options: ListOptions = {},
): Promise<number> {
  const all = await getAllApplications(kv, options);
  return all.filter((app) => (app.status || "new") === status).length;
}

export async function archiveCurrentSeason(kv: KVNamespace): Promise<Season | null> {
  const season = await getCurrentSeason(kv);
  if (!season) return null;

  const archivedAt = Date.now();
  const apps = await getAllApplications(kv);
  for (const app of apps) {
    const archivedKey = `${ARCHIVE_PREFIX}${season.id}:${String(app.createdAt).padStart(13, "0")}:${app.id}`;
    await kv.put(archivedKey, JSON.stringify(app));
    await kv.delete(appKey(app));
  }

  const groups = await getCurrentGroups(kv);
  if (groups.length) {
    await kv.put(`groups:${season.id}`, JSON.stringify(groups));
  }

  const archivedSeason: Season = { ...season, archivedAt };
  await updateSeason(kv, archivedSeason);
  await setCurrentSeason(kv, null);
  return archivedSeason;
}

export async function startNewSeason(kv: KVNamespace, name: string, groups?: Group[]): Promise<Season> {
  await archiveCurrentSeason(kv);

  const id = crypto.randomUUID();
  const startedAt = Date.now();
  const season: Season = { id, name, startedAt };
  await setCurrentSeason(kv, season);
  await addSeason(kv, season);

  if (groups) {
    await setCurrentGroups(kv, groups);
  }

  return season;
}

export async function deleteSeason(kv: KVNamespace, id: string): Promise<void> {
  const seasons = (await getSeasons(kv)).filter((s) => s.id !== id);
  await kv.put(`${CONFIG_PREFIX}seasons`, JSON.stringify(seasons));

  const list = await kv.list({ prefix: `${ARCHIVE_PREFIX}${id}:` });
  for (const key of list.keys) {
    await kv.delete(key.name);
  }
  await kv.delete(`groups:${id}`);
}

export interface AdminRequest {
  userId: number;
  firstName?: string;
  username?: string;
  requestedAt: number;
}

const ADMIN_REQUESTS_KEY = `${CONFIG_PREFIX}adminRequests`;

export async function getAdminRequests(kv: KVNamespace): Promise<AdminRequest[]> {
  const value = await kv.get(ADMIN_REQUESTS_KEY);
  if (!value) return [];
  try {
    return JSON.parse(value) as AdminRequest[];
  } catch {
    return [];
  }
}

export async function saveAdminRequests(kv: KVNamespace, requests: AdminRequest[]): Promise<void> {
  await kv.put(ADMIN_REQUESTS_KEY, JSON.stringify(requests));
}

export async function addAdminRequest(kv: KVNamespace, request: AdminRequest): Promise<void> {
  const requests = await getAdminRequests(kv);
  if (!requests.some((r) => r.userId === request.userId)) {
    requests.unshift(request);
    await saveAdminRequests(kv, requests);
  }
}

export async function removeAdminRequest(kv: KVNamespace, userId: number): Promise<void> {
  const requests = (await getAdminRequests(kv)).filter((r) => r.userId !== userId);
  await saveAdminRequests(kv, requests);
}

// --- Trash bin ---

const TRASH_PREFIX = "trash:item:";
const TRASH_VALUE_SUFFIX = ":value";
const TRASH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type TrashItemType = "application" | "season" | "promo-video" | "admin" | "admin-invite" | "group";

export interface TrashItem {
  id: string;
  type: TrashItemType;
  label: string;
  data: unknown;
  deletedAt: number;
  expiresAt: number;
  originalKey?: string;
}

export async function addTrashItem(
  kv: KVNamespace,
  type: TrashItemType,
  label: string,
  data: unknown,
  binary?: ArrayBuffer,
  originalKey?: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const deletedAt = Date.now();
  const item: TrashItem = { id, type, label, data, deletedAt, expiresAt: deletedAt + TRASH_MAX_AGE_SECONDS * 1000, originalKey };
  await kv.put(`${TRASH_PREFIX}${id}`, JSON.stringify(item), { expirationTtl: TRASH_MAX_AGE_SECONDS });
  if (binary) {
    await kv.put(`${TRASH_PREFIX}${id}${TRASH_VALUE_SUFFIX}`, binary, { expirationTtl: TRASH_MAX_AGE_SECONDS });
  }
  return id;
}

export async function listTrash(kv: KVNamespace, limit = 100): Promise<TrashItem[]> {
  const list = await kv.list({ prefix: TRASH_PREFIX });
  const ids = new Set<string>();
  for (const key of list.keys) {
    const base = key.name.replace(TRASH_PREFIX, "").split(":")[0];
    if (base) ids.add(base);
  }
  const items: TrashItem[] = [];
  for (const id of Array.from(ids).slice(0, limit)) {
    const value = await kv.get(`${TRASH_PREFIX}${id}`);
    if (!value) continue;
    try {
      items.push(JSON.parse(value) as TrashItem);
    } catch {
      /* ignore */
    }
  }
  return items.sort((a, b) => b.deletedAt - a.deletedAt);
}

export async function getTrashItem(kv: KVNamespace, id: string): Promise<{ item: TrashItem; value?: ArrayBuffer } | null> {
  const value = await kv.get(`${TRASH_PREFIX}${id}`);
  if (!value) return null;
  try {
    const item = JSON.parse(value) as TrashItem;
    const binary = await kv.get(`${TRASH_PREFIX}${id}${TRASH_VALUE_SUFFIX}`, "arrayBuffer");
    return { item, value: binary || undefined };
  } catch {
    return null;
  }
}

export async function permanentDeleteTrashItem(kv: KVNamespace, id: string): Promise<void> {
  await kv.delete(`${TRASH_PREFIX}${id}`);
  await kv.delete(`${TRASH_PREFIX}${id}${TRASH_VALUE_SUFFIX}`);
}

export async function restoreTrashItem(kv: KVNamespace, id: string): Promise<boolean> {
  const entry = await getTrashItem(kv, id);
  if (!entry) return false;
  const { item, value } = entry;

  if (item.type === "application") {
    const app = item.data as GroupApplication;
    const key = item.originalKey || `${APP_PREFIX}${String(app.createdAt).padStart(13, "0")}:${app.id}`;
    await kv.put(key, JSON.stringify(app), {
      metadata: { id: app.id, createdAt: app.createdAt, seasonId: app.seasonId },
    });
  } else if (item.type === "season") {
    const { season, apps, groups } = item.data as { season: Season; apps: { key: string; app: GroupApplication }[]; groups: Group[] };
    const seasons = await getSeasons(kv);
    if (!seasons.some((s) => s.id === season.id)) {
      seasons.unshift(season);
      await kv.put(`${CONFIG_PREFIX}seasons`, JSON.stringify(seasons));
    }
    if (groups?.length) {
      await kv.put(`groups:${season.id}`, JSON.stringify(groups));
    }
    for (const { key, app } of apps || []) {
      await kv.put(key, JSON.stringify(app));
    }
  } else if (item.type === "promo-video") {
    const { videoId, meta } = item.data as { videoId: string; meta: Record<string, unknown> };
    if (value) {
      await kv.put(`promo-video:${videoId}`, value, { metadata: meta });
      await kv.put(`promo-video-meta:${videoId}`, JSON.stringify(meta), { expirationTtl: TRASH_MAX_AGE_SECONDS });
    }
  } else if (item.type === "admin") {
    const { userId, profile } = item.data as { userId: number; profile?: AdminProfile };
    const admins = await getAdmins(kv);
    if (!admins.includes(userId)) {
      admins.push(userId);
      await setAdmins(kv, admins);
    }
    if (profile) {
      await saveAdminProfile(kv, profile);
    }
  } else if (item.type === "admin-invite") {
    const invite = item.data as AdminInvite;
    const ttl = Math.max(60, Math.ceil((invite.expiresAt - Date.now()) / 1000));
    await kv.put(`${ADMIN_INVITE_PREFIX}${invite.token}`, JSON.stringify(invite), { expirationTtl: ttl });
  } else if (item.type === "group") {
    const { currentGroups } = item.data as { currentGroups: Group[] };
    await setCurrentGroups(kv, currentGroups);
  }

  await permanentDeleteTrashItem(kv, id);
  return true;
}

