"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Film,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { LogsPanel } from "./LogsPanel";
import { TrashPanel } from "./TrashPanel";
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

type DashboardSummary = {
  groupCount: number;
  newApplicationCount: number;
  applicationCount: number;
  adminCount: number;
  updatedAt: number;
};

type AdminProfile = {
  userId: number;
  firstName?: string;
  username?: string;
  addedAt: number;
};

const API_PREFIX = "/admin/api";

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

function clockOnly(value: string) {
  return value.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0] || "";
}

function timeValue(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

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

export function AdminCMS() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"home" | "groups" | "apps" | "site" | "team">("home");
  const [toasts, setToasts] = useState<{ id: number; text: string; error: boolean }[]>([]);
  const toastIdRef = useRef(0);

  const [groups, setGroups] = useState<Group[]>([]);
  const [apps, setApps] = useState<{ apps: Application[]; total: number }>({ apps: [], total: 0 });
  const [appOffset, setAppOffset] = useState(0);
  const [appQuery, setAppQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [appSortBy, setAppSortBy] = useState<"date" | "name" | "status">("date");
  const [appSortDir, setAppSortDir] = useState<"asc" | "desc">("desc");
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [admins, setAdmins] = useState<number[]>([]);
  const [configuredAdmins, setConfiguredAdmins] = useState<number[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [owner, setOwner] = useState<AdminProfile | null>(null);
  const [newAdmin, setNewAdmin] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<number | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "time" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);

  const show = useCallback((msg: string, error = false) => {
    const id = ++toastIdRef.current;
    const isError = error || msg.toLowerCase().includes("помилка");
    setToasts((prev) => [...prev, { id, text: msg, error: isError }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, [setToasts]);

  const checkAuth = useCallback(async () => {
    try {
      await api<{ ok: true }>("GET", "/me");
      setAuth(true);
    } catch {
      setAuth(false);
    }
  }, [setAuth]);

  const loadGroups = useCallback(async () => {
    try {
      const data = await api<{ groups: Group[] }>("GET", "/groups");
      setGroups(data.groups);
    } catch {
      show(`Не вдалося завантажити групи`, true);
    }
  }, [setGroups, show]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await api<DashboardSummary>("GET", "/dashboard");
      setDashboard(data);
    } catch {
      show("Не вдалося оновити лічильники", true);
    } finally {
      setDashboardLoading(false);
    }
  }, [setDashboard, setDashboardLoading, show]);

  const loadApps = useCallback(async () => {
    try {
      const data = await api<{ apps: Application[]; total: number }>(
        "GET",
        `/applications?offset=${appOffset}&limit=50`,
      );
      setApps(data);
    } catch {
      show("Не вдалося завантажити заявки", true);
    }
  }, [appOffset, setApps, show]);

  const loadAdmins = useCallback(async () => {
    try {
      const data = await api<{
        admins?: number[];
        configuredAdmins?: number[];
        profiles?: AdminProfile[];
        owner?: AdminProfile | null;
      }>("GET", "/admins");
      setAdmins(Array.isArray(data.admins) ? data.admins : []);
      setConfiguredAdmins(Array.isArray(data.configuredAdmins) ? data.configuredAdmins : []);
      setAdminProfiles(Array.isArray(data.profiles) ? data.profiles : []);
      setOwner(data.owner || null);
    } catch {
      show("Не вдалося завантажити команду", true);
    }
  }, [setAdmins, setConfiguredAdmins, setAdminProfiles, setOwner, show]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!auth) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === "home") loadDashboard();
    if (tab === "groups") loadGroups();
    if (tab === "apps") loadApps();
    if (tab === "team") loadAdmins();
  }, [auth, tab, appOffset, loadDashboard, loadGroups, loadApps, loadAdmins]);

  useEffect(() => {
    if (!auth || tab !== "home") return;
    const id = setInterval(() => loadDashboard(), 30000);
    return () => clearInterval(id);
  }, [auth, tab, loadDashboard]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api<{ ok: true }>("POST", "/login", { password });
      setAuth(true);
      setPassword("");
      show("Ви ввійшли");
    } catch {
      show(`Неправильний пароль`, true);
    }
  }

  async function logout() {
    try {
      await api<{ ok: true }>("POST", "/logout");
      setAuth(false);
    } catch {
      show("Не вдалося вийти", true);
    }
  }

  async function persist(nextGroups: Group[]): Promise<boolean> {
    const previousGroups = groups;
    setGroups(nextGroups);
    try {
      const data = await api<{ groups: Group[] }>("PUT", "/groups", { groups: nextGroups });
      setGroups(data.groups);
      show("Групу збережено");
      return true;
    } catch {
      setGroups(previousGroups);
      show(`Не вдалося зберегти групу`, true);
      return false;
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
    });
    setAttempted(false);
    setShowMapPicker(false);
  }

  function openEdit(group: Group) {
    setEditingGroup({ ...group, time: clockOnly(group.time) });
    setAttempted(false);
    setShowMapPicker(false);
  }

  function duplicateGroup(group: Group) {
    setEditingGroup({
      ...group,
      id: Date.now(),
      title: `${group.title} (копія)`,
      time: clockOnly(group.time),
    });
    setAttempted(false);
    setShowMapPicker(false);
  }

  async function handleDelete(id: number) {
    const next = groups.filter((g) => g.id !== id);
    const ok = await persist(next);
    if (ok) setConfirmDeleteId(null);
  }

  async function handleSaveGroup() {
    setAttempted(true);
    if (!editingGroup) return;
    if (
      !editingGroup.title.trim() ||
      !editingGroup.leaders.trim() ||
      !editingGroup.day?.trim() ||
      !editingGroup.time.trim()
    ) {
      show("Заповніть обов’язкові поля", true);
      return;
    }
    const normalized = {
      ...editingGroup,
      title: editingGroup.title.trim(),
      leaders: editingGroup.leaders.trim(),
      time: editingGroup.time.trim(),
      day: editingGroup.day?.trim(),
      address: (editingGroup.address || "").trim(),
      coordinates: (editingGroup.coordinates || "").trim(),
      description: editingGroup.description.trim(),
    };
    const next = groups.some((g) => g.id === normalized.id)
      ? groups.map((g) => (g.id === normalized.id ? normalized : g))
      : [...groups, normalized];
    setSavingGroup(true);
    const saved = await persist(next);
    setSavingGroup(false);
    if (saved) {
      setEditingGroup(null);
      setAttempted(false);
    }
  }

  function handleSort(key: "title" | "time") {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
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
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, "uk") * dir);
    } else if (sortBy === "time") {
      list = [...list].sort((a, b) => {
        const dayDiff = (dayOrder[a.day || ""] || 8) - (dayOrder[b.day || ""] || 8);
        if (dayDiff !== 0) return dayDiff * dir;
        const timeDiff = timeValue(a.time) - timeValue(b.time);
        if (timeDiff !== 0) return timeDiff * dir;
        return a.title.localeCompare(b.title, "uk") * dir;
      });
    }
    return list;
  }, [groups, query, dayFilter, sortBy, sortDir]);

  async function updateApp(id: string, status: Application["status"]) {
    try {
      await api<{ app: Application }>("PUT", `/applications/${id}`, { status });
      await loadApps();
    } catch {
      show("Не вдалося оновити статус", true);
    }
  }

  async function deleteApp(id: string) {
    try {
      await api<{ ok: true }>("DELETE", `/applications/${id}`);
      await loadApps();
      show("Заявку видалено");
    } catch {
      show("Не вдалося видалити заявку", true);
    }
  }

  async function exportCsv() {
    try {
      const res = await fetch(`${API_PREFIX}/export`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zajavky.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      show("Не вдалося експортувати", true);
    }
  }

  async function createAdminInvite(role: "admin" | "owner" = "admin") {
    const username = newAdmin.trim().replace(/^@/, "");
    if (!username) {
      show("Вкажіть Telegram username", true);
      return;
    }
    if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) {
      show("Вкажіть коректний Telegram username", true);
      return;
    }
    setCreatingInvite(true);
    try {
      const path = role === "owner" ? "/owner-invite" : "/admin-invites";
      const data = await api<{ link: string; expiresAt: number }>("POST", path, {
        username: username || undefined,
      });
      setInviteLink(data.link);
      setInviteExpiresAt(data.expiresAt);
      show(role === "owner" ? "Запрошення власника створено" : "Запрошення створено");
    } catch {
      show("Не вдалося створити запрошення", true);
    } finally {
      setCreatingInvite(false);
    }
  }

  async function copyInvite() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      show("Посилання скопійовано");
    } catch {
      show("Не вдалося скопіювати посилання", true);
    }
  }

  async function deleteAdmin(userId: number) {
    try {
      const data = await api<{ admins: number[] }>("DELETE", `/admins/${userId}`);
      setAdmins(data.admins);
      setAdminProfiles((profiles) => profiles.filter((profile) => profile.userId !== userId));
      await loadDashboard();
      show("Адміністратора видалено");
    } catch {
      show("Не вдалося видалити", true);
    }
  }

  const filteredApps = useMemo(() => {
    const q = appQuery.trim().toLowerCase();
    let list = apps.apps;
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.groupNames.join(", ").toLowerCase().includes(q),
      );
    }
    if (appStatusFilter !== "all") {
      list = list.filter((a) => (a.status || "new") === appStatusFilter);
    }
    const dir = appSortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (appSortBy === "date") return (a.createdAt - b.createdAt) * dir;
      if (appSortBy === "name") return a.name.localeCompare(b.name, "uk") * dir;
      const statusOrder = { new: 0, in_progress: 1, done: 2 };
      return (statusOrder[a.status || "new"] - statusOrder[b.status || "new"]) * dir;
    });
    return list;
  }, [apps, appQuery, appStatusFilter, appSortBy, appSortDir]);

  const inputClass =
    "w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]";
  const inputErrorClass =
    "w-full rounded-xl border border-red-400 bg-[var(--paper)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

  if (auth === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <span className="text-[var(--muted)]">Завантаження…</span>
      </div>
    );
  }

  if (!auth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-6">
        <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--rose)] text-[var(--wine)]">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <h1 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">
              Керування сайтом
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Введіть пароль, щоб продовжити
            </p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className={`${inputClass} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-colors hover:text-[var(--wine)]"
                aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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

  const navItems = [
    { key: "home" as const, label: "Головна", icon: Home },
    { key: "groups" as const, label: "Групи", icon: Users },
    { key: "apps" as const, label: "Заявки", icon: FileText },
    { key: "site" as const, label: "Анонс", icon: Video },
    { key: "team" as const, label: "Адміни", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)] font-[var(--sans)] text-[var(--ink)] md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-[var(--line)] bg-white shadow-sm md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[var(--line)] px-6">
          <LayoutDashboard className="h-6 w-6 text-[var(--wine)]" />
          <span className="font-[var(--serif)] text-lg font-semibold text-[var(--wine)]">
            Сайт Еммануїл
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-[var(--wine)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-[var(--line)] p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[var(--line)] bg-white px-4 md:px-8">
          <h1 className="font-[var(--serif)] text-lg font-semibold text-[var(--wine)] md:text-xl">
            {navItems.find((n) => n.key === tab)?.label}
          </h1>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
          >
            <Video className="h-4 w-4" />
            Відкрити сайт
          </a>
        </header>

        <nav className="grid grid-cols-5 gap-1 border-b border-[var(--line)] bg-white p-2 md:hidden">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium leading-tight ${
                tab === key ? "bg-[var(--wine)] text-white" : "text-[var(--muted)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8">
          {tab === "home" && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => setTab("groups")}
                  className="rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Групи</p>
                  <p className="mt-2 font-[var(--serif)] text-3xl font-semibold text-[var(--wine)]">
                    {dashboardLoading && !dashboard ? "—" : dashboard?.groupCount ?? "—"}
                  </p>
                </button>
                <button
                  onClick={() => {
                    setAppStatusFilter("new");
                    setAppOffset(0);
                    setTab("apps");
                  }}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition-shadow hover:shadow-md ${
                    dashboard && dashboard.newApplicationCount > 0
                      ? "border-[var(--wine)] bg-[var(--rose)]"
                      : "border-[var(--line)] bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Нові заявки</p>
                  <p className="mt-2 font-[var(--serif)] text-3xl font-semibold text-[var(--wine)]">
                    {dashboardLoading && !dashboard ? "—" : dashboard?.newApplicationCount ?? "—"}
                  </p>
                  {dashboard && dashboard.newApplicationCount > 0 && (
                    <p className="mt-1 text-xs font-medium text-[var(--wine)]">Потребують обробки</p>
                  )}
                </button>
                <button
                  onClick={() => {
                    setAppStatusFilter("all");
                    setAppOffset(0);
                    setTab("apps");
                  }}
                  className="rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Всі заявки</p>
                  <p className="mt-2 font-[var(--serif)] text-3xl font-semibold text-[var(--ink)]">
                    {dashboardLoading && !dashboard ? "—" : dashboard?.applicationCount ?? "—"}
                  </p>
                </button>
                <button
                  onClick={() => setTab("team")}
                  className="rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Адмінів</p>
                  <p className="mt-2 font-[var(--serif)] text-3xl font-semibold text-[var(--ink)]">
                    {dashboardLoading && !dashboard ? "—" : dashboard?.adminCount ?? "—"}
                  </p>
                </button>
              </section>

              <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <span>
                  {dashboard?.updatedAt
                    ? `Оновлено ${new Date(dashboard.updatedAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`
                    : "Завантажуємо актуальні дані…"}
                </span>
                <button
                  type="button"
                  onClick={loadDashboard}
                  disabled={dashboardLoading}
                  className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-medium text-[var(--ink)] disabled:opacity-50"
                >
                  {dashboardLoading ? "Оновлюємо…" : "Оновити"}
                </button>
              </div>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
                <h2 className="mb-2 font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                  Швидкі дії
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setTab("groups")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                  >
                    <Users className="h-4 w-4" />
                    Керувати групами
                  </button>
                  <button
                    onClick={() => setTab("apps")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                  >
                    <FileText className="h-4 w-4" />
                    Переглянути заявки
                  </button>
                  <button
                    onClick={() => setTab("site")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                  >
                    <Film className="h-4 w-4" />
                    Змінити анонс
                  </button>
                  <button
                    onClick={() => setTab("team")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                  >
                    <Plus className="h-4 w-4" />
                    Додати адміна
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
                <h2 className="mb-2 font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
                  Підказка
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Розділ <strong>Групи</strong> — це домашні групи церкви. Розділ <strong>Заявки</strong> —
                  записи людей, які хочуть долучитися. <strong>Анонс</strong> — відео/текст на головній
                  сторінці.
                </p>
              </section>
            </div>
          )}

          {tab === "groups" && (
            <section className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">Домашні групи</h2>
                  <p className="text-sm text-[var(--muted)]">Редагуйте групи, час, місце зустрічі та лідерів.</p>
                </div>
                <button
                  onClick={openAdd}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                >
                  <Plus className="h-4 w-4" />
                  Додати групу
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
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
                  className={inputClass}
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
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                      sortBy === "time"
                        ? "border-[var(--wine)] bg-[var(--wine)]/10 text-[var(--wine-dark)]"
                        : "border-[var(--line)] bg-white text-[var(--muted)]"
                    }`}
                  >
                    За днем
                    {sortBy === "time" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleSort("title")}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                      sortBy === "title"
                        ? "border-[var(--wine)] bg-[var(--wine)]/10 text-[var(--wine-dark)]"
                        : "border-[var(--line)] bg-white text-[var(--muted)]"
                    }`}
                  >
                    За назвою
                    {sortBy === "title" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {visibleGroups.length === 0 ? (
                <div className="rounded-2xl border border-[var(--line)] bg-white p-10 text-center">
                  <p className="font-[var(--serif)] text-lg font-semibold text-[var(--ink)]">
                    {groups.length === 0 ? "Ще немає домашніх груп" : "Груп не знайдено"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {groups.length === 0
                      ? "Додайте першу групу — і вона з’явиться на сайті."
                      : "Спробуйте змінити пошук або фільтр."}
                  </p>
                  {groups.length === 0 && (
                    <button
                      onClick={openAdd}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                    >
                      <Plus className="h-4 w-4" /> Додати групу
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleGroups.map((g) => (
                    <div key={g.id} className="flex flex-col rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="font-[var(--serif)] text-lg font-semibold text-[var(--ink)]">{g.title}</h3>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(g)}
                            className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--wine)]"
                            title="Редагувати"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => duplicateGroup(g)}
                            className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--wine)]"
                            title="Дублювати"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(g.id)}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mb-2 text-sm font-medium text-[var(--wine)]">
                        {g.day || "—"} о {g.time || "—"}
                      </p>
                      <p className="mb-2 text-sm text-[var(--ink)]">
                        <span className="text-[var(--muted)]">Лідери:</span> {g.leaders}
                      </p>
                      {g.address && (
                        <p className="mb-3 text-sm text-[var(--muted)]">
                          <MapPin className="mb-0.5 inline h-3.5 w-3.5" /> {g.address}
                        </p>
                      )}
                      {g.description && <p className="line-clamp-2 text-sm text-[var(--muted)]">{g.description}</p>}
                      <a
                        href={`/groups?group=${g.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--wine)] transition-colors hover:text-[var(--wine-dark)]"
                      >
                        Подивитись на сайті <span className="text-xs">↗</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "apps" && (
            <section className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">Записи на групи</h2>
                  <p className="text-sm text-[var(--muted)]">Нові заявки та їх статуси обробки.</p>
                </div>
                <button
                  onClick={exportCsv}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                >
                  <Download className="h-4 w-4" />
                  Завантажити CSV
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    value={appQuery}
                    onChange={(e) => setAppQuery(e.target.value)}
                    placeholder="Пошук за іменем, телефоном чи групою"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="all">Усі статуси</option>
                  <option value="new">Нові</option>
                  <option value="in_progress">В роботі</option>
                  <option value="done">Оброблено</option>
                </select>
                <div className="flex items-center gap-2">
                  <select
                    value={appSortBy}
                    onChange={(e) => setAppSortBy(e.target.value as typeof appSortBy)}
                    className={inputClass}
                  >
                    <option value="date">За датою</option>
                    <option value="name">За іменем</option>
                    <option value="status">За статусом</option>
                  </select>
                  <button
                    onClick={() => setAppSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                    aria-label="Напрямок сортування"
                  >
                    {appSortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {filteredApps.length === 0 ? (
                <div className="rounded-2xl border border-[var(--line)] bg-white p-10 text-center">
                  <p className="font-[var(--serif)] text-lg font-semibold text-[var(--ink)]">
                    {apps.total === 0 ? "Ще немає заявок" : "Заявок не знайдено"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {apps.total === 0
                      ? "Коли хтось запишеться на групу, заявка з’явиться тут."
                      : "Спробуйте змінити пошук або фільтр."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApps.map((a) => {
                    const statusColor =
                      a.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : a.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700";
                    const statusText = a.status === "done" ? "Оброблено" : a.status === "in_progress" ? "В роботі" : "Нова";
                    return (
                      <div
                        key={a.id}
                        className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <button
                          onClick={() => setViewingApp(a)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="font-[var(--serif)] text-lg font-semibold text-[var(--ink)]">{a.name}</p>
                          <p className="text-sm text-[var(--muted)]">{a.phone}</p>
                          <p className="mt-1 text-sm text-[var(--ink)]">
                            Групи: {a.groupNames.join(", ")}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                              {statusText}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              {new Date(a.createdAt).toLocaleString("uk-UA")}
                            </span>
                          </div>
                        </button>
                        <div className="flex items-center gap-3">
                          <select
                            value={a.status || "new"}
                            onChange={(e) => updateApp(a.id, e.target.value as Application["status"])}
                            className={inputClass}
                            aria-label="Статус заявки"
                          >
                            <option value="new">Нова</option>
                            <option value="in_progress">В роботі</option>
                            <option value="done">Оброблено</option>
                          </select>
                          <button
                            onClick={() => setViewingApp(a)}
                            className="rounded-xl border border-[var(--line)] p-3 text-[var(--ink)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--wine)]"
                            title="Детальніше"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteApp(a.id)}
                            className="rounded-xl border border-red-200 p-3 text-red-700 transition-colors hover:bg-red-50"
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {apps.total > 50 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setAppOffset((o) => Math.max(0, o - 50))}
                    disabled={appOffset === 0}
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Назад
                  </button>
                  <span className="text-sm text-[var(--muted)]">
                    {appOffset + 1}-{Math.min(appOffset + 50, apps.total)} з {apps.total}
                  </span>
                  <button
                    onClick={() => setAppOffset((o) => o + 50)}
                    disabled={appOffset + 50 >= apps.total}
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] disabled:opacity-40"
                  >
                    Вперед <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === "site" && (
            <section className="max-w-4xl">
              <div className="mb-6">
                <h2 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">Анонс на головній</h2>
                <p className="text-sm text-[var(--muted)]">Відео та текст, який показується першим на сайті.</p>
              </div>
              <SiteConfigEditor />
            </section>
          )}

          {tab === "team" && (
            <div className="max-w-4xl space-y-6">
              <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">Адміністратори</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Створіть персональне запрошення. Людина відкриє його, натисне Start у Telegram —
                    і бот автоматично додасть її до адміністраторів.
                  </p>
                </div>

                <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
                  <label htmlFor="admin-username" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
                    Telegram username
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="admin-username"
                      type="text"
                      value={newAdmin}
                      onChange={(e) => {
                        setNewAdmin(e.target.value);
                        setInviteLink("");
                        setInviteExpiresAt(null);
                      }}
                      placeholder="@username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => createAdminInvite("admin")}
                      disabled={creatingInvite}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--wine)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)] disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {creatingInvite ? "Створюємо…" : "Додати адміна"}
                    </button>
                    {!owner && (
                      <button
                        type="button"
                        onClick={() => createAdminInvite("owner")}
                        disabled={creatingInvite}
                        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--wine)] bg-white px-5 py-3 text-sm font-medium text-[var(--wine)] transition-colors hover:bg-[var(--rose)] disabled:opacity-50"
                      >
                        Зробити власником
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Username потрібен, щоб запрошення не зміг використати інший Telegram-акаунт.
                  </p>

                  {inviteLink && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-900">Запрошення готове</p>
                      <p className="mt-1 break-all text-xs text-emerald-800">{inviteLink}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={copyInvite}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white"
                        >
                          <Copy className="h-4 w-4" /> Скопіювати
                        </button>
                        <a
                          href={inviteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-900"
                        >
                          Відкрити в Telegram
                        </a>
                      </div>
                      {inviteExpiresAt && (
                        <p className="mt-2 text-xs text-emerald-800">
                          Діє до {new Date(inviteExpiresAt).toLocaleString("uk-UA")}. Після використання посилання вимикається.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {owner && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-[var(--gold)] bg-amber-50 p-4">
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-[var(--ink)]">
                        {owner.username ? `@${owner.username}` : owner.firstName || "Власник"}
                      </strong>
                      <span className="block text-xs text-[var(--muted)]">ID: {owner.userId}</span>
                    </span>
                    <span className="rounded-full bg-[var(--wine)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                      Власник
                    </span>
                  </div>
                )}

                {admins.length === 0 && configuredAdmins.length === 0 && !owner ? (
                  <p className="text-sm text-[var(--muted)]">Адміністраторів ще не підключено.</p>
                ) : (
                  <ul className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {admins.filter((id) => id !== owner?.userId).map((id) => (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3"
                      >
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-[var(--ink)]">
                            {adminProfiles.find((profile) => profile.userId === id)?.username
                              ? `@${adminProfiles.find((profile) => profile.userId === id)?.username}`
                              : adminProfiles.find((profile) => profile.userId === id)?.firstName || "Telegram-адмін"}
                          </strong>
                          <span className="block text-xs text-[var(--muted)]">ID: {id}</span>
                        </span>
                        <button
                          onClick={() => deleteAdmin(id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Видалити
                        </button>
                      </li>
                    ))}
                    {configuredAdmins.filter((id) => id !== owner?.userId).map((id) => (
                      <li
                        key={`configured-${id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3"
                      >
                        <span>
                          <strong className="block text-sm text-[var(--ink)]">Адміністратор з налаштувань</strong>
                          <span className="block text-xs text-[var(--muted)]">ID: {id}</span>
                        </span>
                        <span className="rounded-full bg-[var(--rose)] px-2 py-1 text-xs font-semibold text-[var(--wine)]">
                          Env
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <LogsPanel />
              </section>

              <section>
                <TrashPanel />
              </section>
            </div>
          )}
        </main>
      </div>

      {editingGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4">
          <div
            className="h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-2xl sm:h-auto sm:max-h-[94vh] sm:rounded-3xl sm:border sm:border-[var(--line)] sm:p-7"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">
                {groups.some((g) => g.id === editingGroup.id) ? "Редагувати групу" : "Нова група"}
              </h2>
              <button
                onClick={() => setEditingGroup(null)}
                className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--paper)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Назва групи *</label>
                <input
                  value={editingGroup.title}
                  onChange={(e) => setEditingGroup({ ...editingGroup, title: e.target.value })}
                  placeholder="Наприклад: Молодіжна група"
                  className={attempted && !editingGroup.title.trim() ? inputErrorClass : inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Лідери *</label>
                <input
                  value={editingGroup.leaders}
                  onChange={(e) => setEditingGroup({ ...editingGroup, leaders: e.target.value })}
                  placeholder="Прізвища та імена лідерів"
                  className={attempted && !editingGroup.leaders.trim() ? inputErrorClass : inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">День тижня *</label>
                <select
                  value={editingGroup.day || ""}
                  onChange={(e) => setEditingGroup({ ...editingGroup, day: e.target.value })}
                  className={attempted && !editingGroup.day?.trim() ? inputErrorClass : inputClass}
                >
                  <option value="">Оберіть день</option>
                  {ukrainianDays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Час *</label>
                <input
                  type="time"
                  value={editingGroup.time}
                  onChange={(e) => setEditingGroup({ ...editingGroup, time: e.target.value })}
                  className={attempted && !editingGroup.time.trim() ? inputErrorClass : inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Адреса зустрічі</label>
                <input
                  value={editingGroup.address || ""}
                  onChange={(e) => setEditingGroup({ ...editingGroup, address: e.target.value })}
                  placeholder="Наприклад: вул. Героїв Майдану, 109"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Місце на карті</label>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3">
                  <MapPin className="h-5 w-5 text-[var(--wine)]" />
                  <div className="flex-1">
                    <p className="text-xs text-[var(--muted)]">Координати</p>
                    <p className="font-mono text-sm text-[var(--ink)]">
                      {editingGroup.coordinates || "Ще не вказані"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMapPicker(true)}
                    className="rounded-xl bg-[var(--wine)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
                  >
                    {editingGroup.coordinates ? "Змінити" : "Вказати"}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Опис</label>
                <textarea
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  placeholder="Короткий опис групи"
                  rows={4}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingGroup(null)}
                className="rounded-xl border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
              >
                Скасувати
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={savingGroup}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)] disabled:opacity-60"
              >
                {savingGroup ? <AlertCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {savingGroup ? "Зберігаємо…" : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMapPicker && editingGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <MapPicker
              initialAddress={editingGroup.address}
              initialCoordinates={editingGroup.coordinates}
              onSave={(v: MapPickerValue) => {
                setEditingGroup({
                  ...editingGroup,
                  address: v.address,
                  coordinates: v.coordinates,
                });
                setShowMapPicker(false);
              }}
              onClose={() => setShowMapPicker(false)}
            />
          </div>
        </div>
      )}

      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">{viewingApp.name}</h3>
              <button
                onClick={() => setViewingApp(null)}
                className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--paper)]"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-[var(--muted)]">Телефон:</span>{" "}
                <a href={`tel:${viewingApp.phone}`} className="text-[var(--wine)] hover:underline">
                  {viewingApp.phone}
                </a>
              </p>
              <p>
                <span className="text-[var(--muted)]">Групи:</span> {viewingApp.groupNames.join(", ")}
              </p>
              <p>
                <span className="text-[var(--muted)]">Дата:</span>{" "}
                {new Date(viewingApp.createdAt).toLocaleString("uk-UA")}
              </p>
              <p>
                <span className="text-[var(--muted)]">Сезон:</span> {viewingApp.seasonId}
              </p>
              <p>
                <span className="text-[var(--muted)]">Статус:</span>{" "}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    viewingApp.status === "done"
                      ? "bg-emerald-100 text-emerald-700"
                      : viewingApp.status === "in_progress"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {viewingApp.status === "done" ? "Оброблено" : viewingApp.status === "in_progress" ? "В роботі" : "Нова"}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  deleteApp(viewingApp.id);
                  setViewingApp(null);
                }}
                className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                Видалити
              </button>
              <button
                onClick={() => setViewingApp(null)}
                className="rounded-xl bg-[var(--wine)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <h3 className="mb-2 font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">Видалити групу?</h3>
            <p className="mb-5 text-sm text-[var(--muted)]">
              Цю дію не можна буде скасувати. Група зникне із сайту.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-xl border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
              >
                Скасувати
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}

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
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
