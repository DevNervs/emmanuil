"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trash2, Clock, Package } from "lucide-react";

type TrashItem = {
  id: string;
  type: string;
  label: string;
  deletedAt: number;
  expiresAt: number;
};

const typeNames: Record<string, string> = {
  application: "Заявка",
  season: "Сезон",
  "promo-video": "Промо-відео",
  admin: "Адмін",
  "admin-invite": "Запрошення",
  group: "Група",
};

export function TrashPanel() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/admin/api/trash", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { items: TrashItem[] };
      setItems(data.items);
    } catch (err: unknown) {
      setMessage(`Помилка: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setLoading(false);
    }
  }, [setItems, setLoading, setMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function restore(id: string) {
    setWorking(id);
    setMessage("");
    try {
      const res = await fetch(`/admin/api/trash/${encodeURIComponent(id)}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMessage("Відновлено з кошика");
    } catch (err: unknown) {
      setMessage(`Помилка: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setWorking(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Видалити назавжди? Цю дію не скасувати.")) return;
    setWorking(id);
    setMessage("");
    try {
      const res = await fetch(`/admin/api/trash/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMessage("Видалено назавжди");
    } catch (err: unknown) {
      setMessage(`Помилка: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setWorking(null);
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
      <div className="mb-5 flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-[var(--wine)]" aria-hidden="true" />
        <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">
          Кошик
        </h2>
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

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Кошик порожній. Видалені дані зберігаються тут до 30 днів.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {items.map((item) => (
            <li key={item.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {typeNames[item.type] || item.type} — {item.label}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Видалено {new Date(item.deletedAt).toLocaleString("uk-UA")}
                      {item.expiresAt && (
                        <>, видалиться остаточно {new Date(item.expiresAt).toLocaleString("uk-UA")}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restore(item.id)}
                    disabled={working === item.id}
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)] disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Відновити
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    disabled={working === item.id}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Видалити
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
