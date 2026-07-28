import type { GroupApplication } from "./types";

const PREFIX = "app:";

function makeKey(app: GroupApplication): string {
  return `${PREFIX}${String(app.createdAt).padStart(13, "0")}:${app.id}`;
}

function appKey(id: string, createdAt?: number): string {
  if (createdAt) return `${PREFIX}${String(createdAt).padStart(13, "0")}:${id}`;
  return `${PREFIX}${id}`;
}

export async function saveApplication(
  kv: KVNamespace,
  app: GroupApplication,
): Promise<void> {
  await kv.put(makeKey(app), JSON.stringify(app), {
    metadata: { id: app.id, createdAt: app.createdAt },
  });
}

export async function getApplication(
  kv: KVNamespace,
  id: string,
): Promise<GroupApplication | null> {
  const { keys } = await kv.list<{ id: string }>({ prefix: PREFIX });
  const key = keys.find((k) => k.metadata?.id === id) ?? keys.find((k) => k.name.endsWith(`:${id}`));
  if (!key) return null;
  const value = await kv.get(key.name);
  if (!value) return null;
  return JSON.parse(value) as GroupApplication;
}

async function getAllApplications(kv: KVNamespace): Promise<GroupApplication[]> {
  const apps: GroupApplication[] = [];
  let cursor: string | undefined;
  do {
    const list = await kv.list<Record<string, unknown>>({ prefix: PREFIX, cursor });
    const values = await Promise.all(list.keys.map((key) => kv.get(key.name)));
    for (const value of values) {
      if (value) apps.push(JSON.parse(value) as GroupApplication);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return apps.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listApplications(
  kv: KVNamespace,
  options: { offset?: number; limit?: number } = {},
): Promise<{ apps: GroupApplication[]; total: number }> {
  const all = await getAllApplications(kv);
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 10;
  return { apps: all.slice(offset, offset + limit), total: all.length };
}

export async function searchApplications(
  kv: KVNamespace,
  query: string,
): Promise<GroupApplication[]> {
  const lower = query.toLowerCase();
  const all = await getAllApplications(kv);
  return all.filter((app) =>
    app.name.toLowerCase().includes(lower) ||
    app.phone.toLowerCase().includes(lower) ||
    app.groupNames.some((name) => name.toLowerCase().includes(lower)),
  );
}

export async function filterApplicationsByGroup(
  kv: KVNamespace,
  groupIndex: number,
): Promise<GroupApplication[]> {
  const all = await getAllApplications(kv);
  return all.filter((app) => app.groups.includes(groupIndex));
}

export async function countApplications(kv: KVNamespace): Promise<number> {
  const all = await getAllApplications(kv);
  return all.length;
}

export async function deleteApplication(
  kv: KVNamespace,
  id: string,
  createdAt?: number,
): Promise<void> {
  if (createdAt) {
    await kv.delete(appKey(id, createdAt));
    return;
  }
  const { keys } = await kv.list<{ id: string }>({ prefix: PREFIX });
  const key = keys.find((k) => k.metadata?.id === id) ?? keys.find((k) => k.name.endsWith(`:${id}`));
  if (key) await kv.delete(key.name);
}
