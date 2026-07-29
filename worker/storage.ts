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
