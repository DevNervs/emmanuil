"use client";

import { useEffect, useState } from "react";
import {
  Download,
  FileText,
  LogOut,
  Plus,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { MapPicker } from "./MapPicker";

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

export function AdminClient() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"groups" | "apps" | "admins">("groups");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [apps, setApps] = useState<{ apps: Application[]; total: number }>({ apps: [], total: 0 });
  const [appOffset, setAppOffset] = useState(0);
  const [admins, setAdmins] = useState<number[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [mapGroupId, setMapGroupId] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!auth) return;
    if (tab === "groups") loadGroups();
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

  const isError =
    message.includes("Помилка") || message.toLowerCase().includes("error");

  const mapGroup =
    mapGroupId !== null ? groups.find((g) => g.id === mapGroupId) : null;

  if (auth === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] font-[var(--sans)] text-[var(--ink)]">
        <span className="text-[var(--muted)]">Завантаження...</span>
      </div>
    );
  }

  if (!auth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-6 font-[var(--sans)] text-[var(--ink)]">
        <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-center font-[var(--serif)] text-2xl font-semibold uppercase tracking-widest text-[var(--wine)]">
            Адміністрація
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--muted)]">
            Увійдіть, щоб продовжити
          </p>

          {message && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[var(--line)] bg-[var(--rose)] text-[var(--wine-dark)]"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
              required
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--wine)] p-3 font-[var(--serif)] text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[var(--wine-dark)]"
            >
              Увійти
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] p-4 pb-12 font-[var(--sans)] text-[var(--ink)] md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-[var(--wine)]" aria-hidden="true" />
            <h1 className="font-[var(--serif)] text-xl font-semibold uppercase tracking-[0.15em] text-[var(--wine)] md:text-2xl">
              Адміністрація
            </h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Вийти
          </button>
        </header>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              isError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[var(--wine)]/20 bg-[var(--rose)] text-[var(--wine-dark)]"
            }`}
          >
            {message}
          </div>
        )}

        <nav className="rounded-2xl border border-[var(--line)] bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTab("groups")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === "groups"
                  ? "border-b-2 border-[var(--wine)] text-[var(--wine)]"
                  : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Групи
            </button>
            <button
              onClick={() => setTab("apps")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === "apps"
                  ? "border-b-2 border-[var(--wine)] text-[var(--wine)]"
                  : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              }`}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Заявки
            </button>
            <button
              onClick={() => setTab("admins")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === "admins"
                  ? "border-b-2 border-[var(--wine)] text-[var(--wine)]"
                  : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              }`}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Адміни
            </button>
          </div>
        </nav>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
          {tab === "groups" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
                  <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                    Групи
                  </h2>
                </div>
                <button
                  onClick={addGroup}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Додати групу
                </button>
              </div>

              <div className="grid gap-4">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-[var(--serif)] text-sm font-medium uppercase tracking-wider text-[var(--wine)]">
                        Група №{g.id}
                      </span>
                      <button
                        onClick={() => deleteGroup(g.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Видалити
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <input
                        value={g.title}
                        onChange={(e) => updateGroup(g.id, { title: e.target.value })}
                        placeholder="Назва групи"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                      />
                      <input
                        value={g.leaders}
                        onChange={(e) => updateGroup(g.id, { leaders: e.target.value })}
                        placeholder="Лідери"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                      />
                      <input
                        value={g.time}
                        onChange={(e) => updateGroup(g.id, { time: e.target.value })}
                        placeholder="Час зустрічі"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                      />
                      <input
                        value={g.day || ""}
                        onChange={(e) => updateGroup(g.id, { day: e.target.value })}
                        placeholder="День тижня"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                      />
                      <input
                        value={g.address || ""}
                        onChange={(e) => updateGroup(g.id, { address: e.target.value })}
                        placeholder="Адреса"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                      />
                      <input
                        value={g.coordinates || ""}
                        onChange={(e) => updateGroup(g.id, { coordinates: e.target.value })}
                        placeholder="Координати"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                      />
                      <button
                        type="button"
                        onClick={() => setMapGroupId(g.id)}
                        className="inline-flex w-full items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                      >
                        🗺 Карта
                      </button>
                      <textarea
                        value={g.description}
                        onChange={(e) => updateGroup(g.id, { description: e.target.value })}
                        placeholder="Опис групи"
                        rows={3}
                        className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)] md:col-span-2 lg:col-span-3"
                      />
                      <label className="flex items-center gap-2 md:col-span-2 lg:col-span-3">
                        <input
                          type="checkbox"
                          checked={!!g.showOnHome}
                          onChange={(e) => updateGroup(g.id, { showOnHome: e.target.checked })}
                          className="h-4 w-4 rounded border-[var(--line)] accent-[var(--wine)]"
                        />
                        <span className="text-sm text-[var(--ink)]">Показувати на головній</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveGroups}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Зберегти
                </button>
              </div>
            </div>
          )}

          {tab === "apps" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
                  <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                    Заявки
                  </h2>
                </div>
                <button
                  onClick={exportCsv}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export CSV
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--paper)] text-left">
                      <tr>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Імʼя
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Телефон
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Групи
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Дата
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Статус
                        </th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {apps.apps.map((a) => (
                        <tr key={a.id} className="hover:bg-[var(--paper)]/60">
                          <td className="p-3 text-[var(--ink)]">{a.name}</td>
                          <td className="p-3 text-[var(--ink)]">{a.phone}</td>
                          <td className="p-3 text-[var(--ink)]">{a.groupNames.join(", ")}</td>
                          <td className="p-3 text-[var(--ink)]">
                            {new Date(a.createdAt).toLocaleString("uk-UA")}
                          </td>
                          <td className="p-3">
                            <select
                              value={a.status || "new"}
                              onChange={(e) => updateApp(a.id, e.target.value as Application["status"])}
                              className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2 text-sm text-[var(--ink)] transition-colors focus:border-[var(--wine)] focus:outline-none"
                            >
                              <option value="new">Нова</option>
                              <option value="in_progress">В роботі</option>
                              <option value="done">Оброблена</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => deleteApp(a.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              Видалити
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {apps.total > 50 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={appOffset === 0}
                    onClick={() => setAppOffset((o) => Math.max(0, o - 50))}
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Назад
                  </button>
                  <span className="text-sm text-[var(--muted)]">
                    {appOffset + 1}–{Math.min(appOffset + 50, apps.total)} з {apps.total}
                  </span>
                  <button
                    disabled={appOffset + 50 >= apps.total}
                    onClick={() => setAppOffset((o) => o + 50)}
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Вперед
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "admins" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
                <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                  Адміни
                </h2>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {admins.map((id) => (
                  <li
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-3 shadow-sm"
                  >
                    <code className="font-mono text-sm text-[var(--ink)]">{id}</code>
                    <button
                      onClick={() => deleteAdmin(id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Видалити
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-end gap-3">
                <input
                  type="number"
                  value={newAdmin}
                  onChange={(e) => setNewAdmin(e.target.value)}
                  placeholder="ID користувача Telegram"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)] sm:w-auto"
                />
                <button
                  onClick={addAdmin}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Додати
                </button>
              </div>
            </div>
          )}
        </section>

        {mapGroup && (
          <MapPicker
            initialAddress={mapGroup.address}
            initialCoordinates={mapGroup.coordinates}
            onSave={({ address, coordinates }) =>
              updateGroup(mapGroup.id, { address, coordinates })
            }
            onClose={() => setMapGroupId(null)}
          />
        )}
      </div>
    </main>
  );
}
