"use client";

import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";

type Log = {
  id: string;
  action: string;
  details?: string;
  timestamp: number;
};

const actionNames: Record<string, string> = {
  groups_updated: "Оновлено групи",
  site_config_updated: "Оновлено конфіг сайту",
  admin_added: "Додано адміна",
  admin_removed: "Видалено адміна",
};

export function LogsPanel() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const res = await fetch("/admin/api/logs", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { logs: Log[] };
      setLogs(data.logs);
    } catch (err: any) {
      setMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function clear() {
    if (!confirm("Очистити всю історію?")) return;
    try {
      const res = await fetch("/admin/api/logs", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setLogs([]);
      setMessage("Історію очищено");
    } catch (err: any) {
      setMessage(`Помилка: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-[var(--muted)]">
        Завантаження...
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
          <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
            Логи змін
          </h2>
        </div>
        {logs.length > 0 && (
          <button
            onClick={clear}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Очистити
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            message.startsWith("Помилка")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[var(--wine)]/20 bg-[var(--rose)] text-[var(--wine-dark)]"
          }`}
        >
          {message}
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Історія порожня.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {logs.map((log) => (
            <li key={log.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--ink)]">
                  {actionNames[log.action] || log.action}
                </span>
                <time className="text-xs text-[var(--muted)]">
                  {new Date(log.timestamp).toLocaleString("uk-UA")}
                </time>
              </div>
              {log.details && <p className="text-sm text-[var(--muted)]">{log.details}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
