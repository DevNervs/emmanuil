"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Film, LoaderCircle, Save, Upload } from "lucide-react";
import { defaultConfig } from "./SiteConfig";
import type { PromoConfig, SiteConfig } from "./SiteConfig";

const API_PREFIX = "/admin/api";
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]";
const inputErrorClass = `${inputClass} border-red-400 focus:border-red-500 focus:ring-red-100`;

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function SiteConfigEditor() {
  const [config, setConfig] = useState<SiteConfig>({});
  const [promo, setPromo] = useState<PromoConfig>(defaultConfig.promo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [videoName, setVideoName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_PREFIX}/site`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as SiteConfig;
        setConfig(data);
        setPromo(data.promo ? { ...defaultConfig.promo, ...data.promo } : defaultConfig.promo);
      })
      .catch(() => setMessage({ text: "Не вдалося завантажити анонс. Оновіть сторінку.", error: true }))
      .finally(() => setLoading(false));
  }, []);

  function update(next: Partial<PromoConfig>) {
    setPromo((current) => ({ ...current, ...next }));
    setMessage(null);
  }

  async function uploadVideo(file: File) {
    setMessage(null);
    if (!file.type.startsWith("video/")) {
      setMessage({ text: "Оберіть відеофайл.", error: true });
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setMessage({ text: `Файл завеликий. Максимальний розмір — ${formatBytes(MAX_VIDEO_SIZE)}.`, error: true });
      return;
    }

    setUploading(true);
    try {
      const res = await fetch(`${API_PREFIX}/promo-video`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": file.type || "video/mp4",
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok || !data.url) throw new Error(data.message || "Не вдалося завантажити відео");
      update({ videoUrl: data.url });
      setVideoName(file.name);
      setMessage({ text: "Відео завантажено. Тепер збережіть анонс.", error: false });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Не вдалося завантажити відео.",
        error: true,
      });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function save() {
    setAttempted(true);
    if (promo.enabled && (!promo.videoUrl.trim() || !promo.title.trim())) {
      setMessage({ text: "Додайте відео та заголовок.", error: true });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const nextConfig = { ...config, promo };
      const res = await fetch(`${API_PREFIX}/site`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig),
      });
      if (!res.ok) throw new Error("Не вдалося зберегти анонс");
      setConfig(nextConfig);
      setAttempted(false);
      setMessage({
        text: promo.enabled ? "Анонс збережено і показується на сайті." : "Анонс вимкнено і приховано із сайту.",
        error: false,
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Не вдалося зберегти анонс.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-[var(--muted)]">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        Завантажуємо анонс…
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-7">
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">Головна сторінка</p>
        <h2 className="font-[var(--serif)] text-2xl font-semibold text-[var(--ink)]">Анонс</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Тут налаштовується один великий анонс під головним відео сайту.
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={promo.enabled}
        onClick={() => update({ enabled: !promo.enabled })}
        className={`mb-6 flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
          promo.enabled
            ? "border-emerald-300 bg-emerald-50"
            : "border-[var(--line)] bg-[var(--paper)]"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-full ${promo.enabled ? "bg-emerald-600 text-white" : "bg-white text-[var(--muted)]"}`}>
            {promo.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </span>
          <span>
            <strong className="block text-sm text-[var(--ink)]">
              {promo.enabled ? "Анонс показується на сайті" : "Анонс прихований"}
            </strong>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Натисніть, щоб {promo.enabled ? "вимкнути" : "увімкнути"}.
            </span>
          </span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${promo.enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${promo.enabled ? "translate-x-6" : "translate-x-1"}`} />
        </span>
      </button>

      <div className={`space-y-5 ${promo.enabled ? "" : "pointer-events-none opacity-45"}`} aria-disabled={!promo.enabled}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">Відео</label>
          <input
            ref={fileInput}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadVideo(file);
            }}
          />
          <button
            type="button"
            disabled={!promo.enabled || uploading}
            onClick={() => fileInput.current?.click()}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-sm font-medium transition-colors ${
              attempted && !promo.videoUrl.trim()
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--wine)] hover:text-[var(--wine)]"
            }`}
          >
            {uploading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : promo.videoUrl ? <Film className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            {uploading ? "Завантажуємо відео…" : promo.videoUrl ? "Замінити відео" : "Обрати відеофайл"}
          </button>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {videoName ? `Обрано: ${videoName}` : promo.videoUrl ? "Відео вже додано." : "MP4, WebM або MOV, до 20 МБ."}
          </p>
        </div>

        <div>
          <label htmlFor="promo-title" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Заголовок</label>
          <input
            id="promo-title"
            value={promo.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="Наприклад: Літній табір"
            className={attempted && !promo.title.trim() ? inputErrorClass : inputClass}
          />
        </div>

        <div>
          <label htmlFor="promo-description" className="mb-2 block text-sm font-semibold text-[var(--ink)]">Опис</label>
          <textarea
            id="promo-description"
            value={promo.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={7}
            placeholder="Коротко розкажіть, що це за подія і для кого вона."
            className={`${inputClass} resize-y`}
          />
        </div>

        {promo.videoUrl && (
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--ink)]">Попередній перегляд</p>
            <video
              key={promo.videoUrl}
              src={promo.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="max-h-[28rem] w-full rounded-2xl bg-black object-contain"
            />
          </div>
        )}
      </div>

      {message && (
        <div className={`mt-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          message.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}>
          {message.error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || uploading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--wine)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--wine-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Зберігаємо…" : "Зберегти анонс"}
        </button>
      </div>
    </section>
  );
}
