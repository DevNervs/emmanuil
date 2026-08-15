"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  HandHeart,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { LogsPanel } from "./LogsPanel";
import { MapPicker, MapPickerValue } from "./MapPicker";
import { SiteConfigEditor } from "./SiteConfigEditor";

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

type ApplicationType = "group" | "serving" | "question";

type Application = {
  id: string;
  type?: ApplicationType;
  name: string;
  phone: string;
  email?: string;
  groups: number[];
  groupNames: string[];
  serving?: string;
  message?: string;
  createdAt: number;
  seasonId: string;
  status?: "new" | "in_progress" | "done";
};

type Serving = {
  id: number;
  title: string;
  description: string;
};

type AppTypeFilter = "all" | ApplicationType;

const API_PREFIX = "/admin/api";

const APP_TYPE_META: Record<ApplicationType, { label: string; className: string }> = {
  group: { label: "Домашня група", className: "bg-[var(--rose)] text-[var(--wine-dark)]" },
  serving: { label: "Служіння", className: "bg-emerald-50 text-emerald-700" },
  question: { label: "Питання", className: "bg-sky-50 text-sky-700" },
};

function appType(app: Application): ApplicationType {
  return app.type === "serving" || app.type === "question" ? app.type : "group";
}

const ukrainianDays = [
  "Понеділок",
  "Вівторок",
  "Середа",
  "Четвер",
  "П’ятниця",
  "Субота",
  "Неділя",
];

const dayOrder: Record<string, number> = {
  Понеділок: 1,
  Вівторок: 2,
  Середа: 3,
  Четвер: 4,
  "П’ятниця": 5,
  Субота: 6,
  Неділя: 7,
};

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
  const [tab, setTab] = useState<"groups" | "servings" | "apps" | "admins" | "site" | "logs">("groups");
  const [toasts, setToasts] = useState<{ id: number; text: string; error: boolean }[]>([]);
  const [password, setPassword] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [servings, setServings] = useState<Serving[]>([]);
  const [apps, setApps] = useState<{ apps: Application[]; total: number }>({
    apps: [],
    total: 0,
  });
  const [appOffset, setAppOffset] = useState(0);
  const [appTypeFilter, setAppTypeFilter] = useState<AppTypeFilter>("all");
  const [appStats, setAppStats] = useState<{ total: number; byType: Record<ApplicationType, number> }>({
    total: 0,
    byType: { group: 0, serving: 0, question: 0 },
  });
  const [admins, setAdmins] = useState<number[]>([]);
  const [newAdmin, setNewAdmin] = useState("");

  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "time" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!auth) return;
    if (tab === "groups") loadGroups();
    if (tab === "servings") loadServings();
    if (tab === "apps") {
      loadApps();
      loadAppStats();
    }
    if (tab === "admins") loadAdmins();
  }, [auth, tab, appOffset, appTypeFilter]);

  function show(msg: string) {
    const id = Date.now();
    const error = msg.includes("Помилка") || msg.toLowerCase().includes("error");
    setToasts((prev) => [...prev, { id, text: msg, error }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  async function checkAuth() {
    try {
      await api<{ ok: true }>("GET", "/me");
      setAuth(true);
    } catch {
      setAuth(false);
    }
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

  async function persist(nextGroups: Group[]) {
    setGroups(nextGroups);
    try {
      const data = await api<{ groups: Group[] }>("PUT", "/groups", {
        groups: nextGroups,
      });
      setGroups(data.groups);
      show("Групи збережено");
    } catch (err: any) {
      show(`Помилка збереження: ${err.message}`);
    }
  }

  function openAdd() {
    setEditingGroup({
      id: Date.now(),
      title: "",
      leaders: "",
      description: "",
      time: "",
      day: "",
      address: "",
      coordinates: "",
      showOnHome: true,
    });
    setAttempted(false);
    setShowMapPicker(false);
  }

  function openEdit(group: Group) {
    setEditingGroup({ ...group });
    setAttempted(false);
    setShowMapPicker(false);
  }

  function duplicateGroup(group: Group) {
    setEditingGroup({
      ...group,
      id: Date.now(),
      title: `${group.title} (копія)`,
    });
    setAttempted(false);
    setShowMapPicker(false);
  }

  async function toggleShow(id: number) {
    const next = groups.map((g) =>
      g.id === id ? { ...g, showOnHome: !g.showOnHome } : g,
    );
    await persist(next);
  }

  function handleSort(key: "title" | "time") {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  function timeValue(time: string): number {
    const m = time.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = groups.filter((g) => {
      const matchesQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.leaders.toLowerCase().includes(q) ||
        (g.address || "").toLowerCase().includes(q);
      const matchesDay = dayFilter === "all" || g.day === dayFilter;
      return matchesQuery && matchesDay;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "title") {
      list = [...list].sort(
        (a, b) => a.title.localeCompare(b.title, "uk") * dir,
      );
    } else if (sortBy === "time") {
      list = [...list].sort((a, b) => {
        const dayDiff =
          (dayOrder[a.day || ""] || 8) - (dayOrder[b.day || ""] || 8);
        if (dayDiff !== 0) return dayDiff * dir;
        const timeDiff = timeValue(a.time) - timeValue(b.time);
        if (timeDiff !== 0) return timeDiff * dir;
        return a.title.localeCompare(b.title, "uk") * dir;
      });
    }
    return list;
  }, [groups, query, dayFilter, sortBy, sortDir]);

  function handleSaveGroup() {
    setAttempted(true);
    if (!editingGroup) return;
    if (
      !editingGroup.title.trim() ||
      !editingGroup.leaders.trim() ||
      !editingGroup.time.trim()
    ) {
      return;
    }
    const next = groups.some((g) => g.id === editingGroup.id)
      ? groups.map((g) => (g.id === editingGroup.id ? editingGroup : g))
      : [...groups, editingGroup];
    persist(next);
    setEditingGroup(null);
    setAttempted(false);
  }

  async function loadApps() {
    try {
      const typeParam = appTypeFilter === "all" ? "" : `&type=${appTypeFilter}`;
      const data = await api<{ apps: Application[]; total: number }>(
        "GET",
        `/applications?offset=${appOffset}&limit=50${typeParam}`,
      );
      setApps(data);
    } catch (err: any) {
      show(`Помилка завантаження заявок: ${err.message}`);
    }
  }

  async function loadAppStats() {
    try {
      const data = await api<{ total: number; byType: Record<ApplicationType, number> }>(
        "GET",
        "/stats",
      );
      setAppStats(data);
    } catch {
      // stats are decorative; ignore failures
    }
  }

  async function loadServings() {
    try {
      const data = await api<{ servings: Serving[] }>("GET", "/servings");
      setServings(data.servings);
    } catch (err: any) {
      show(`Помилка завантаження служінь: ${err.message}`);
    }
  }

  async function persistServings(nextServings: Serving[]) {
    setServings(nextServings);
    try {
      const data = await api<{ servings: Serving[] }>("PUT", "/servings", {
        servings: nextServings,
      });
      setServings(data.servings);
      show("Служіння збережено");
    } catch (err: any) {
      show(`Помилка збереження: ${err.message}`);
    }
  }

  function addServing() {
    const nextId = servings.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    setServings((prev) => [...prev, { id: nextId, title: "", description: "" }]);
  }

  function updateServing(id: number, patch: Partial<Serving>) {
    setServings((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function saveServing(serving: Serving) {
    if (!serving.title.trim()) {
      show("Помилка: вкажіть назву служіння");
      return;
    }
    persistServings(
      servings.map((s) => (s.id === serving.id ? { ...serving, title: serving.title.trim(), description: serving.description.trim() } : s)),
    );
  }

  function deleteServing(id: number) {
    if (!confirm("Видалити служіння?")) return;
    persistServings(servings.filter((s) => s.id !== id));
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
      await Promise.all([loadApps(), loadAppStats()]);
      show("Заявку видалено");
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    }
  }

  async function exportCsv() {
    try {
      const typeParam = appTypeFilter === "all" ? "" : `?type=${appTypeFilter}`;
      const res = await fetch(`${API_PREFIX}/export${typeParam}`, {
        credentials: "include",
      });
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
      const data = await api<{ admins: number[] }>("POST", "/admins", {
        userId,
      });
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

  const inputClass =
    "w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]";
  const inputErrorClass =
    "w-full rounded-lg border border-red-400 bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

  function ToastContainer() {
    if (!toasts.length) return null;
    return (
      <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
              t.error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[var(--wine)]/20 bg-[var(--rose)] text-[var(--wine-dark)]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span>{t.text}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label="Закрити"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (auth === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] font-[var(--sans)] text-[var(--ink)]">
        <span className="text-[var(--muted)]">Завантаження...</span>
      </div>
    );
  }

  if (!auth) {
    return (
      <>
        <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-6 font-[var(--sans)] text-[var(--ink)]">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8 shadow-lg">
            <h1 className="mb-2 text-center font-[var(--serif)] text-2xl font-semibold uppercase tracking-widest text-[var(--wine)]">
              Адміністрація
            </h1>
            <p className="mb-6 text-center text-sm text-[var(--muted)]">
              Увійдіть, щоб продовжити
            </p>

            <form onSubmit={login} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className={inputClass}
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
        <ToastContainer />
      </>
    );
  }

  const navItems = [
    { key: "groups" as const, label: "Групи", icon: Users },
    { key: "servings" as const, label: "Служіння", icon: HandHeart },
    { key: "apps" as const, label: "Заявки", icon: FileText },
    { key: "admins" as const, label: "Адміни", icon: Shield },
    { key: "site" as const, label: "Сайт", icon: Settings },
    { key: "logs" as const, label: "Логи", icon: Clock },
  ];

  const appTypeTabs: { key: AppTypeFilter; label: string; count: number }[] = [
    { key: "all", label: "Усі", count: appStats.total },
    { key: "group", label: "Домашні групи", count: appStats.byType.group },
    { key: "serving", label: "Служіння", count: appStats.byType.serving },
    { key: "question", label: "Питання", count: appStats.byType.question },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--paper)] font-[var(--sans)] text-[var(--ink)]">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-[var(--line)] bg-white shadow-sm md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[var(--line)] px-6">
          <Shield className="h-6 w-6 text-[var(--wine)]" aria-hidden="true" />
          <span className="font-[var(--serif)] text-lg font-semibold uppercase tracking-widest text-[var(--wine)]">
            Адмінка
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-[var(--wine)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white px-4 shadow-sm md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Shield className="h-6 w-6 text-[var(--wine)]" aria-hidden="true" />
            <span className="font-[var(--serif)] text-lg font-semibold uppercase tracking-widest text-[var(--wine)]">
              Адміністрація
            </span>
          </div>
          <h1 className="hidden font-[var(--serif)] text-xl font-semibold uppercase tracking-[0.15em] text-[var(--wine)] md:block">
            Адміністрація
          </h1>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Вийти
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {tab === "groups" && (
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
                  <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                    Групи
                  </h2>
                </div>
                <button
                  onClick={openAdd}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Додати групу
                </button>
              </div>

              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Пошук за назвою, лідерами чи адресою"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <select
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] focus:border-[var(--wine)] focus:outline-none lg:w-auto"
                >
                  <option value="all">Усі дні</option>
                  {ukrainianDays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSort("time")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      sortBy === "time"
                        ? "border-[var(--wine)] bg-[var(--wine)]/10 text-[var(--wine-dark)]"
                        : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    За днем/часом
                    {sortBy === "time" ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort("title")}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      sortBy === "title"
                        ? "border-[var(--wine)] bg-[var(--wine)]/10 text-[var(--wine-dark)]"
                        : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    За назвою
                    {sortBy === "title" ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--paper)] text-left">
                      <tr>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Назва
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          День / Час
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Лідери
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Адреса
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Показувати
                        </th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {visibleGroups.map((g) => (
                        <tr key={g.id} className="hover:bg-[var(--paper)]/60">
                          <td className="p-3 font-medium text-[var(--ink)]">
                            {g.title}
                          </td>
                          <td className="p-3 text-[var(--ink)]">
                            {g.day && (
                              <span className="block text-[var(--ink)]">{g.day}</span>
                            )}
                            <span className="text-[var(--muted)]">{g.time}</span>
                          </td>
                          <td className="p-3 text-[var(--ink)]">{g.leaders}</td>
                          <td className="p-3 text-[var(--muted)]">
                            {g.address || "—"}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleShow(g.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                g.showOnHome ? "bg-[var(--wine)]" : "bg-[var(--line)]"
                              }`}
                              aria-pressed={!!g.showOnHome}
                              aria-label="Показувати на сайті"
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  g.showOnHome ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                title="Редагувати"
                                onClick={() => openEdit(g)}
                                className="inline-flex items-center rounded-lg border border-[var(--line)] p-2 text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                title="Дублювати"
                                onClick={() => duplicateGroup(g)}
                                className="inline-flex items-center rounded-lg border border-[var(--line)] p-2 text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                              >
                                <Copy className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                title="Видалити"
                                onClick={() => setConfirmDeleteId(g.id)}
                                className="inline-flex items-center rounded-lg border border-red-200 p-2 text-red-700 transition-colors hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visibleGroups.length === 0 && (
                  <div className="p-8 text-center text-sm text-[var(--muted)]">
                    Груп не знайдено
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "servings" && (
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
                  <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                    Служіння
                  </h2>
                </div>
                <button
                  onClick={addServing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Додати служіння
                </button>
              </div>

              <p className="mb-4 text-sm text-[var(--muted)]">
                Список напрямків, які бачать відвідувачі на сторінці «Служіння» та можуть
                обрати в анкеті. Зміни зберігаються після натискання «Зберегти» у рядку.
              </p>

              <div className="grid gap-3">
                {servings.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                  >
                    <input
                      value={s.title}
                      onChange={(e) => updateServing(s.id, { title: e.target.value })}
                      placeholder="Назва служіння"
                      className={inputClass}
                    />
                    <input
                      value={s.description}
                      onChange={(e) => updateServing(s.id, { description: e.target.value })}
                      placeholder="Короткий опис"
                      className={inputClass}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => saveServing(s)}
                        title="Зберегти"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Зберегти
                      </button>
                      <button
                        onClick={() => deleteServing(s.id)}
                        title="Видалити"
                        className="inline-flex items-center rounded-lg border border-red-200 bg-white p-2 text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
                {servings.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                    Служінь не додано. На сайті використовується стандартний список.
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "apps" && (
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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

              <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Категорії заявок">
                {appTypeTabs.map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={appTypeFilter === t.key}
                    onClick={() => {
                      setAppTypeFilter(t.key);
                      setAppOffset(0);
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      appTypeFilter === t.key
                        ? "border-[var(--wine)] bg-[var(--wine)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--wine)] hover:text-[var(--wine)]"
                    }`}
                  >
                    {t.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        appTypeFilter === t.key
                          ? "bg-white/20 text-white"
                          : "bg-[var(--paper)] text-[var(--muted)]"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--paper)] text-left">
                      <tr>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Тип
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Імʼя
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Контакт
                        </th>
                        <th className="p-3 font-[var(--serif)] text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                          Деталі
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
                      {apps.apps.map((a) => {
                        const type = appType(a);
                        return (
                          <tr key={a.id} className="hover:bg-[var(--paper)]/60">
                            <td className="p-3">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${APP_TYPE_META[type].className}`}
                              >
                                {APP_TYPE_META[type].label}
                              </span>
                            </td>
                            <td className="p-3 text-[var(--ink)]">{a.name}</td>
                            <td className="p-3 text-[var(--ink)]">
                              {a.phone && <span className="block">{a.phone}</span>}
                              {a.email && (
                                <span className="block text-[var(--muted)]">{a.email}</span>
                              )}
                              {!a.phone && !a.email && "—"}
                            </td>
                            <td className="max-w-md p-3 text-[var(--ink)]">
                              {type === "group" && a.groupNames.join(", ")}
                              {type === "serving" && (
                                <>
                                  <span className="font-medium">{a.serving}</span>
                                  {a.message && (
                                    <span className="block text-[var(--muted)]">{a.message}</span>
                                  )}
                                </>
                              )}
                              {type === "question" && (
                                <span
                                  className="line-clamp-3 whitespace-pre-wrap"
                                  title={a.message}
                                >
                                  {a.message}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-[var(--ink)]">
                              {new Date(a.createdAt).toLocaleString("uk-UA")}
                            </td>
                            <td className="p-3">
                              <select
                                value={a.status || "new"}
                                onChange={(e) =>
                                  updateApp(
                                    a.id,
                                    e.target.value as Application["status"],
                                  )
                                }
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {apps.apps.length === 0 && (
                  <div className="p-8 text-center text-sm text-[var(--muted)]">
                    Заявок у цій категорії немає
                  </div>
                )}
              </div>

              {apps.total > 50 && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    disabled={appOffset === 0}
                    onClick={() => setAppOffset((o) => Math.max(0, o - 50))}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Назад
                  </button>
                  <span className="text-sm text-[var(--muted)]">
                    {appOffset + 1}–{Math.min(appOffset + 50, apps.total)} з{" "}
                    {apps.total}
                  </span>
                  <button
                    disabled={appOffset + 50 >= apps.total}
                    onClick={() => setAppOffset((o) => o + 50)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Вперед
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === "admins" && (
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
                <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                  Адміни
                </h2>
              </div>

              <ul className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {admins.map((id) => (
                  <li
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm"
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
            </section>
          )}

          {tab === "site" && <SiteConfigEditor />}

          {tab === "logs" && <LogsPanel />}
        </main>
        <ToastContainer />
      </div>

      {editingGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-[var(--serif)] text-lg font-semibold text-[var(--wine)]">
                {editingGroup.title.trim() || "Нова група"}
              </h3>
              <button
                onClick={() => setEditingGroup(null)}
                className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  Назва <span className="text-red-500">*</span>
                </label>
                <input
                  value={editingGroup.title}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, title: e.target.value })
                  }
                  placeholder="Назва групи"
                  className={
                    attempted && !editingGroup.title.trim()
                      ? inputErrorClass
                      : inputClass
                  }
                />
                {attempted && !editingGroup.title.trim() && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    Вкажіть назву групи
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  Лідери <span className="text-red-500">*</span>
                </label>
                <input
                  value={editingGroup.leaders}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, leaders: e.target.value })
                  }
                  placeholder="Прізвища та імена лідерів"
                  className={
                    attempted && !editingGroup.leaders.trim()
                      ? inputErrorClass
                      : inputClass
                  }
                />
                {attempted && !editingGroup.leaders.trim() && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    Вкажіть лідерів
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  Час зустрічі <span className="text-red-500">*</span>
                </label>
                <input
                  value={editingGroup.time}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, time: e.target.value })
                  }
                  placeholder="Наприклад: Вівторок, 18:00"
                  className={
                    attempted && !editingGroup.time.trim()
                      ? inputErrorClass
                      : inputClass
                  }
                />
                {attempted && !editingGroup.time.trim() && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    Вкажіть час зустрічі
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  День тижня
                </label>
                <select
                  value={editingGroup.day || ""}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, day: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Оберіть день</option>
                  {ukrainianDays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  Адреса
                </label>
                <input
                  value={editingGroup.address || ""}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, address: e.target.value })
                  }
                  placeholder="Адреса зустрічі"
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  Координати
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={editingGroup.coordinates || ""}
                    readOnly
                    placeholder="Виберіть місце на карті"
                    className="flex-1 cursor-not-allowed rounded-lg border border-[var(--line)] bg-[var(--paper)]/60 p-2.5 text-sm text-[var(--ink)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    🗺 Вибрати на карті
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
                  Опис
                </label>
                <textarea
                  value={editingGroup.description}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      description: e.target.value,
                    })
                  }
                  placeholder="Короткий опис групи"
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={!!editingGroup.showOnHome}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      showOnHome: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-[var(--line)] accent-[var(--wine)]"
                />
                <span className="text-sm text-[var(--ink)]">Показувати на сайті</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingGroup(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
              >
                Скасувати
              </button>
              <button
                onClick={handleSaveGroup}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}

      {showMapPicker && editingGroup && (
        <MapPicker
          initialAddress={editingGroup.address}
          initialCoordinates={editingGroup.coordinates}
          onSave={({ address, coordinates }: MapPickerValue) =>
            setEditingGroup({
              ...editingGroup,
              address,
              coordinates,
            })
          }
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
            <h3 className="mb-2 font-[var(--serif)] text-lg font-semibold text-[var(--wine)]">
              Підтвердіть видалення
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Ви впевнені, що хочете видалити групу „
              {groups.find((g) => g.id === confirmDeleteId)?.title || ""}“?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
              >
                Скасувати
              </button>
              <button
                onClick={() => {
                  const next = groups.filter((g) => g.id !== confirmDeleteId);
                  persist(next);
                  setConfirmDeleteId(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
