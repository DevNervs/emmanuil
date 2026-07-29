"use client";

import { useEffect, useState } from "react";

type Group = {
  id: number;
  title: string;
  leaders: string;
  description: string;
  time: string;
  day?: string;
  address?: string;
  coordinates?: string;
  showOnHome?: boolean;
};

type Season = {
  id: string;
  name: string;
  startedAt: number;
  archivedAt?: number;
};

type Application = {
  id: string;
  name: string;
  phone: string;
  groups: number[];
  groupNames: string[];
  createdAt: number;
  seasonId: string;
  status?: "new" | "in_progress" | "done";
};

const API_PREFIX = "/admin/api";

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_PREFIX}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export default function AdminPage() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"groups" | "seasons" | "apps" | "admins">("groups");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [seasons, setSeasons] = useState<{ current: Season | null; seasons: Season[] }>({
    current: null,
    seasons: [],
  });
  const [seasonName, setSeasonName] = useState("");
  const [apps, setApps] = useState<{ apps: Application[]; total: number }>({ apps: [], total: 0 });
  const [appOffset, setAppOffset] = useState(0);
  const [admins, setAdmins] = useState<number[]>([]);
  const [newAdmin, setNewAdmin] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!auth) return;
    if (tab === "groups") loadGroups();
    if (tab === "seasons") loadSeasons();
    if (tab === "apps") loadApps();
    if (tab === "admins") loadAdmins();
  }, [auth, tab, appOffset]);

  async function checkAuth() {
    try {
      await api<{ ok: true }>("GET", "/me");
      setAuth(true);
    } catch {
      setAuth(false);
    }
  }

  function show(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api<{ ok: true }>("POST", "/login", { password });
      setAuth(true);
      setPassword("");
      show("Успішно увійшли");
    } catch (err: any) {
      show(`Помилка входу: ${err.message}`);
    }
  }

  async function logout() {
    try {
      await api<{ ok: true }>("POST", "/logout");
      setAuth(false);
      show("Вийшли");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function loadGroups() {
    try {
      const data = await api<{ groups: Group[] }>("GET", "/groups");
      setGroups(data.groups);
    } catch (err: any) {
      show(`Помилка завантаження груп: ${err.message}`);
    }
  }

  async function saveGroups() {
    try {
      const data = await api<{ groups: Group[] }>("PUT", "/groups", { groups });
      setGroups(data.groups);
      show("Групи збережено");
    } catch (err: any) {
      show(`Помилка збереження: ${err.message}`);
    }
  }

  function addGroup() {
    setGroups((g) => [
      ...g,
      {
        id: Date.now(),
        title: "",
        leaders: "",
        description: "",
        time: "",
      },
    ]);
  }

  function updateGroup(id: number, patch: Partial<Group>) {
    setGroups((g) => g.map((gr) => (gr.id === id ? { ...gr, ...patch } : gr)));
  }

  function deleteGroup(id: number) {
    setGroups((g) => g.filter((gr) => gr.id !== id));
  }

  async function loadSeasons() {
    try {
      const data = await api<{ current: Season | null; seasons: Season[] }>("GET", "/seasons");
      setSeasons(data);
    } catch (err: any) {
      show(`Помилка завантаження сезонів: ${err.message}`);
    }
  }

  async function startSeason() {
    try {
      await api<{ season: Season }>("POST", "/seasons", { name: seasonName });
      setSeasonName("");
      await loadSeasons();
      show("Сезон розпочато");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function archiveSeason() {
    try {
      await api<{ archived: Season | null }>("POST", "/seasons/archive");
      await loadSeasons();
      show("Сезон архівовано");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function deleteSeason(id: string) {
    try {
      await api<{ ok: true }>("DELETE", `/seasons/${id}`);
      await loadSeasons();
      show("Сезон видалено");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function loadApps() {
    try {
      const data = await api<{ apps: Application[]; total: number }>(
        "GET",
        `/applications?offset=${appOffset}&limit=50`,
      );
      setApps(data);
    } catch (err: any) {
      show(`Помилка завантаження заявок: ${err.message}`);
    }
  }

  async function updateApp(id: string, status: Application["status"]) {
    try {
      await api<{ app: Application }>("PUT", `/applications/${id}`, { status });
      await loadApps();
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function deleteApp(id: string) {
    if (!confirm("Видалити заявку?")) return;
    try {
      await api<{ ok: true }>("DELETE", `/applications/${id}`);
      await loadApps();
      show("Заявку видалено");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function exportCsv() {
    try {
      const res = await fetch(`${API_PREFIX}/export`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "applications.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      show(`Помилка експорту: ${err.message}`);
    }
  }

  async function loadAdmins() {
    try {
      const data = await api<{ admins: number[] }>("GET", "/admins");
      setAdmins(data.admins);
    } catch (err: any) {
      show(`Помилка завантаження адмінів: ${err.message}`);
    }
  }

  async function addAdmin() {
    const userId = parseInt(newAdmin, 10);
    if (!Number.isFinite(userId)) return show("Некоректний ID");
    try {
      const data = await api<{ admins: number[] }>("POST", "/admins", { userId });
      setAdmins(data.admins);
      setNewAdmin("");
      show("Адміна додано");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function deleteAdmin(userId: number) {
    try {
      const data = await api<{ admins: number[] }>("DELETE", `/admins/${userId}`);
      setAdmins(data.admins);
      show("Адміна видалено");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  if (auth === null) {
    return <div className="p-8 text-center">Завантаження...</div>;
  }

  if (!auth) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-semibold">Адміністрація</h1>
          {message && <div className="mb-4 text-sm text-red-600">{message}</div>}
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full rounded border border-gray-300 p-2"
              required
            />
            <button
              type="submit"
              className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700"
            >
              Увійти
            </button>
          </form>
        </div>
      </main>
    );
  }

  const tabClass = (key: typeof tab) =>
    `px-4 py-2 font-medium ${tab === key ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow">
          <h1 className="text-2xl font-semibold">Адміністрація</h1>
          <button
            onClick={logout}
            className="rounded bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
          >
            Вийти
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="mb-4 border-b border-gray-200 bg-white shadow">
          <nav className="flex">
            <button onClick={() => setTab("groups")} className={tabClass("groups")}>
              Групи
            </button>
            <button onClick={() => setTab("seasons")} className={tabClass("seasons")}>
              Сезони
            </button>
            <button onClick={() => setTab("apps")} className={tabClass("apps")}>
              Заявки
            </button>
            <button onClick={() => setTab("admins")} className={tabClass("admins")}>
              Адміни
            </button>
          </nav>
        </div>

        <div className="rounded-lg bg-white p-4 shadow md:p-6">
          {tab === "groups" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Групи</h2>
                <button
                  onClick={addGroup}
                  className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Додати групу
                </button>
              </div>
              <div className="space-y-3">
                {groups.map((g) => (
                  <div key={g.id} className="grid gap-3 rounded border border-gray-200 p-3 md:grid-cols-2 lg:grid-cols-3">
                    <input
                      value={g.title}
                      onChange={(e) => updateGroup(g.id, { title: e.target.value })}
                      placeholder="Назва"
                      className="rounded border border-gray-300 p-2"
                    />
                    <input
                      value={g.leaders}
                      onChange={(e) => updateGroup(g.id, { leaders: e.target.value })}
                      placeholder="Лідери"
                      className="rounded border border-gray-300 p-2"
                    />
                    <input
                      value={g.time}
                      onChange={(e) => updateGroup(g.id, { time: e.target.value })}
                      placeholder="Час"
                      className="rounded border border-gray-300 p-2"
                    />
                    <input
                      value={g.day || ""}
                      onChange={(e) => updateGroup(g.id, { day: e.target.value })}
                      placeholder="День"
                      className="rounded border border-gray-300 p-2"
                    />
                    <input
                      value={g.address || ""}
                      onChange={(e) => updateGroup(g.id, { address: e.target.value })}
                      placeholder="Адреса"
                      className="rounded border border-gray-300 p-2"
                    />
                    <input
                      value={g.coordinates || ""}
                      onChange={(e) => updateGroup(g.id, { coordinates: e.target.value })}
                      placeholder="Координати"
                      className="rounded border border-gray-300 p-2"
                    />
                    <textarea
                      value={g.description}
                      onChange={(e) => updateGroup(g.id, { description: e.target.value })}
                      placeholder="Опис"
                      className="rounded border border-gray-300 p-2 md:col-span-2 lg:col-span-3"
                      rows={2}
                    />
                    <label className="flex items-center gap-2 text-sm md:col-span-2 lg:col-span-3">
                      <input
                        type="checkbox"
                        checked={!!g.showOnHome}
                        onChange={(e) => updateGroup(g.id, { showOnHome: e.target.checked })}
                      />
                      Показувати на головній
                    </label>
                    <div className="md:col-span-2 lg:col-span-3">
                      <button
                        onClick={() => deleteGroup(g.id)}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={saveGroups}
                className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Зберегти
              </button>
            </div>
          )}

          {tab === "seasons" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Сезони</h2>
              {seasons.current ? (
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <strong>Поточний:</strong> {seasons.current.name} (
                  {new Date(seasons.current.startedAt).toLocaleDateString("uk-UA")})
                </div>
              ) : (
                <div className="rounded border border-gray-200 p-3 text-gray-600">Немає поточного сезону.</div>
              )}

              <div className="flex flex-wrap items-end gap-2">
                <input
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="Назва нового сезону"
                  className="rounded border border-gray-300 p-2"
                />
                <button
                  onClick={startSeason}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Почати новий сезон
                </button>
                <button
                  onClick={archiveSeason}
                  className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
                >
                  Архівувати поточний
                </button>
              </div>

              <h3 className="font-medium">Архів</h3>
              <ul className="space-y-2">
                {seasons.seasons.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded border border-gray-200 p-2">
                    <span>
                      {s.name} — {new Date(s.startedAt).toLocaleDateString("uk-UA")}
                      {s.archivedAt ? ` (архівовано ${new Date(s.archivedAt).toLocaleDateString("uk-UA")})` : ""}
                    </span>
                    <button
                      onClick={() => deleteSeason(s.id)}
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Видалити
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "apps" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Заявки</h2>
                <button
                  onClick={exportCsv}
                  className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-900"
                >
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100 text-left">
                      <th className="p-2">Імʼя</th>
                      <th className="p-2">Телефон</th>
                      <th className="p-2">Групи</th>
                      <th className="p-2">Дата</th>
                      <th className="p-2">Статус</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.apps.map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{a.phone}</td>
                        <td className="p-2">{a.groupNames.join(", ")}</td>
                        <td className="p-2">
                          {new Date(a.createdAt).toLocaleString("uk-UA")}
                        </td>
                        <td className="p-2">
                          <select
                            value={a.status || "new"}
                            onChange={(e) => updateApp(a.id, e.target.value as Application["status"])}
                            className="rounded border border-gray-300 p-1"
                          >
                            <option value="new">Нова</option>
                            <option value="in_progress">В роботі</option>
                            <option value="done">Оброблена</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => deleteApp(a.id)}
                            className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {apps.total > 50 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={appOffset === 0}
                    onClick={() => setAppOffset((o) => Math.max(0, o - 50))}
                    className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <span className="text-sm text-gray-600">
                    {appOffset + 1}–{Math.min(appOffset + 50, apps.total)} з {apps.total}
                  </span>
                  <button
                    disabled={appOffset + 50 >= apps.total}
                    onClick={() => setAppOffset((o) => o + 50)}
                    className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "admins" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Адміни</h2>
              <ul className="space-y-2">
                {admins.map((id) => (
                  <li key={id} className="flex items-center justify-between rounded border border-gray-200 p-2">
                    <span className="font-mono">{id}</span>
                    <button
                      onClick={() => deleteAdmin(id)}
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                    >
                      Видалити
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end gap-2">
                <input
                  type="number"
                  value={newAdmin}
                  onChange={(e) => setNewAdmin(e.target.value)}
                  placeholder="Telegram user ID"
                  className="rounded border border-gray-300 p-2"
                />
                <button
                  onClick={addAdmin}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Додати
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
