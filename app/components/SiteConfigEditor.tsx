"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Globe, Image, MapPin, Megaphone, Play, Plus, Save, Trash2, Video, X } from "lucide-react";
import { MapPicker, MapPickerValue } from "./MapPicker";
import { defaultConfig } from "./SiteConfig";
import type { SiteConfig, ServiceLocationConfig, TeamMemberConfig, Announcement, HeroConfig, PromoConfig } from "./SiteConfig";

type SubTab = "hero" | "announcement" | "promo" | "locations" | "team";

const API_PREFIX = "/admin/api";

const inputClass =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]";
const inputErrorClass =
  "w-full rounded-lg border border-red-400 bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200";

function emptyLocation(): ServiceLocationConfig {
  return {
    id: Date.now(),
    label: "",
    address: "",
    streetAddress: "",
    addressLocality: "Чернівці",
    addressRegion: "Чернівецька область",
    time: "Щонеділі о 10:00",
    coordinates: "",
    mapsUrl: "",
    showOnHome: true,
  };
}

function emptyMember(): TeamMemberConfig {
  return {
    id: Date.now(),
    name: "",
    role: "",
    image: "/media/team-ministry.webp?v=q3",
    facebook: "",
    instagram: "",
  };
}

export function SiteConfigEditor() {
  const [active, setActive] = useState<SubTab>("hero");
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);

  const [mapLocationIndex, setMapLocationIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_PREFIX}/site`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as SiteConfig;
        setConfig((prev) => ({
          hero: { ...prev.hero, ...(data.hero || {}) },
          announcement: data.announcement !== undefined ? data.announcement : prev.announcement,
          serviceLocations: data.serviceLocations?.length ? data.serviceLocations : prev.serviceLocations,
          team: data.team?.length ? data.team : prev.team,
        }));
      })
      .catch(() => setMessage("Не вдалося завантажити конфіг"))
      .finally(() => setLoading(false));
  }, []);

  const hero = config.hero ?? defaultConfig.hero;
  const announcement = config.announcement;
  const promo = config.promo ?? defaultConfig.promo;
  const locations = config.serviceLocations ?? defaultConfig.serviceLocations ?? [];
  const team = config.team ?? defaultConfig.team ?? [];

  const isError = message.toLowerCase().includes("помилка") || message.includes("Не вдалося");

  const invalidLocations = useMemo(() => {
    return locations.filter((l) => !l.label.trim() || !l.address.trim() || !l.coordinates.trim());
  }, [locations]);

  const invalidTeam = useMemo(() => {
    return team.filter((m) => !m.name.trim() || !m.role.trim());
  }, [team]);

  function show(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  }

  async function handleSave() {
    setAttempted(true);
    if (invalidLocations.length || invalidTeam.length) {
      show("Заповніть обов’язкові поля");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_PREFIX}/site`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      show("Конфіг збережено");
      setAttempted(false);
    } catch (err: any) {
      show(`Помилка: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function updateHero(next: Partial<HeroConfig>) {
    setConfig((prev) => ({ ...prev, hero: { ...defaultConfig.hero, ...(prev.hero || {}), ...next } }));
  }

  function updatePromo(next: Partial<PromoConfig>) {
    setConfig((prev) => ({ ...prev, promo: { ...defaultConfig.promo, ...(prev.promo || {}), ...next } }));
  }

  function updateAnnouncement(next: Partial<Announcement> | null) {
    setConfig((prev) => ({ ...prev, announcement: next ? { ...prev.announcement, ...next } as Announcement : null }));
  }

  function updateLocation(index: number, next: Partial<ServiceLocationConfig>) {
    setConfig((prev) => ({
      ...prev,
      serviceLocations: (prev.serviceLocations || []).map((l, i) => (i === index ? { ...l, ...next } : l)),
    }));
  }

  function addLocation() {
    setConfig((prev) => ({
      ...prev,
      serviceLocations: [...(prev.serviceLocations || []), emptyLocation()],
    }));
  }

  function removeLocation(index: number) {
    setConfig((prev) => ({
      ...prev,
      serviceLocations: (prev.serviceLocations || []).filter((_, i) => i !== index),
    }));
  }

  function moveLocation(index: number, dir: -1 | 1) {
    const arr = [...locations];
    const next = index + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[index], arr[next]] = [arr[next], arr[index]];
    setConfig((prev) => ({ ...prev, serviceLocations: arr }));
  }

  function updateMember(index: number, next: Partial<TeamMemberConfig>) {
    setConfig((prev) => ({
      ...prev,
      team: (prev.team || []).map((m, i) => (i === index ? { ...m, ...next } : m)),
    }));
  }

  function addMember() {
    setConfig((prev) => ({
      ...prev,
      team: [...(prev.team || []), emptyMember()],
    }));
  }

  function removeMember(index: number) {
    setConfig((prev) => ({
      ...prev,
      team: (prev.team || []).filter((_, i) => i !== index),
    }));
  }

  function moveMember(index: number, dir: -1 | 1) {
    const arr = [...team];
    const next = index + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[index], arr[next]] = [arr[next], arr[index]];
    setConfig((prev) => ({ ...prev, team: arr }));
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-[var(--muted)]">
        Завантаження...
      </div>
    );
  }

  const tabs: { key: SubTab; label: string; icon: typeof Video }[] = [
    { key: "hero", label: "Hero", icon: Video },
    { key: "announcement", label: "Анонс", icon: Megaphone },
    { key: "promo", label: "Анонс", icon: Play },
    { key: "locations", label: "Локації", icon: MapPin },
    { key: "team", label: "Служителі", icon: Globe },
  ];

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)]">Конфігурація сайту</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)] disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? "Збереження..." : "Зберегти"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[var(--wine)]/20 bg-[var(--rose)] text-[var(--wine-dark)]"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active === key
                ? "bg-[var(--wine)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {active === "hero" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">HLS потік</label>
            <input
              value={hero.hlsUrl || ""}
              onChange={(e) => updateHero({ hlsUrl: e.target.value })}
              placeholder="/media/hero-hls-grade3/master.m3u8"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Fallback відео</label>
            <input
              value={hero.fallbackUrl || ""}
              onChange={(e) => updateHero({ fallbackUrl: e.target.value })}
              placeholder="/media/hero-worship-loop.mp4"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Poster</label>
            <div className="flex gap-2">
              <Image className="h-5 w-5 text-[var(--muted)]" aria-hidden="true" />
              <input
                value={hero.posterUrl || ""}
                onChange={(e) => updateHero({ posterUrl: e.target.value })}
                placeholder="/media/hero-worship-poster.jpg"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Poster srcSet</label>
            <input
              value={hero.posterSrcSet || ""}
              onChange={(e) => updateHero({ posterSrcSet: e.target.value })}
              placeholder="/poster-800.webp 800w, /poster.jpg 1920w"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {active === "announcement" && (
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!announcement?.enabled}
              onChange={(e) => updateAnnouncement(announcement ? { enabled: e.target.checked } : { text: "", enabled: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--line)] accent-[var(--wine)]"
            />
            <span className="text-sm text-[var(--ink)]">Показувати анонс</span>
          </label>
          {announcement?.enabled && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Текст</label>
                <input
                  value={announcement.text || ""}
                  onChange={(e) => updateAnnouncement({ text: e.target.value })}
                  placeholder="Реєстрація відкрита!"
                  className={attempted && !announcement.text.trim() ? inputErrorClass : inputClass}
                />
                {attempted && !announcement.text.trim() && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    Вкажіть текст анонсу
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Посилання (необов’язково)</label>
                <input
                  value={announcement.href || ""}
                  onChange={(e) => updateAnnouncement({ href: e.target.value })}
                  placeholder="/groups"
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>
      )}

      {active === "promo" && (
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!promo.enabled}
              onChange={(e) => updatePromo({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--line)] accent-[var(--wine)]"
            />
            <span className="text-sm text-[var(--ink)]">Показувати блок під hero</span>
          </label>
          {promo.enabled && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Файл відео</label>
                <input
                  value={promo.videoUrl || ""}
                  onChange={(e) => updatePromo({ videoUrl: e.target.value })}
                  placeholder="/media/promo-camp.mp4"
                  className={attempted && !promo.videoUrl.trim() ? inputErrorClass : inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Заголовок</label>
                <input
                  value={promo.title || ""}
                  onChange={(e) => updatePromo({ title: e.target.value })}
                  placeholder="Назва події"
                  className={attempted && !promo.title.trim() ? inputErrorClass : inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--ink)]">Опис</label>
                <textarea
                  value={promo.description || ""}
                  onChange={(e) => updatePromo({ description: e.target.value })}
                  rows={4}
                  placeholder="Короткий опис..."
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>
      )}

      {active === "locations" && (
        <div className="space-y-4">
          {locations.map((location, index) => (
            <div
              key={location.id || index}
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--wine)]">{location.label || `Локація ${index + 1}`}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveLocation(index, -1)} className="rounded-lg p-2 hover:bg-[var(--line)]" aria-label="Вгору"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => moveLocation(index, 1)} className="rounded-lg p-2 hover:bg-[var(--line)]" aria-label="Вниз"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => removeLocation(index)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label="Видалити"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Назва</label>
                  <input
                    value={location.label}
                    onChange={(e) => updateLocation(index, { label: e.target.value })}
                    className={attempted && !location.label.trim() ? inputErrorClass : inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Час</label>
                  <input
                    value={location.time}
                    onChange={(e) => updateLocation(index, { time: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Адреса</label>
                  <input
                    value={location.address}
                    onChange={(e) => updateLocation(index, { address: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Вулиця</label>
                  <input
                    value={location.streetAddress}
                    onChange={(e) => updateLocation(index, { streetAddress: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Місто</label>
                  <input
                    value={location.addressLocality}
                    onChange={(e) => updateLocation(index, { addressLocality: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Координати</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={location.coordinates}
                      readOnly
                      placeholder="Виберіть місце на карті"
                      className="flex-1 cursor-not-allowed rounded-lg border border-[var(--line)] bg-[var(--paper)]/60 p-2.5 text-sm text-[var(--ink)]"
                    />
                    <button
                      type="button"
                      onClick={() => setMapLocationIndex(index)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
                    >
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      🗺 Вибрати на карті
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Посилання Google Maps</label>
                  <input
                    value={location.mapsUrl}
                    onChange={(e) => updateLocation(index, { mapsUrl: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={!!location.showOnHome}
                    onChange={(e) => updateLocation(index, { showOnHome: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--line)] accent-[var(--wine)]"
                  />
                  <span className="text-sm text-[var(--ink)]">Показувати на головній</span>
                </label>
              </div>
            </div>
          ))}
          <button
            onClick={addLocation}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Додати локацію
          </button>
        </div>
      )}

      {active === "team" && (
        <div className="space-y-4">
          {team.map((member, index) => (
            <div key={member.id || index} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--wine)]">{member.name || `Служитель ${index + 1}`}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveMember(index, -1)} className="rounded-lg p-2 hover:bg-[var(--line)]" aria-label="Вгору"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => moveMember(index, 1)} className="rounded-lg p-2 hover:bg-[var(--line)]" aria-label="Вниз"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => removeMember(index)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label="Видалити"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Ім’я</label>
                  <input
                    value={member.name}
                    onChange={(e) => updateMember(index, { name: e.target.value })}
                    className={attempted && !member.name.trim() ? inputErrorClass : inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Посада</label>
                  <input
                    value={member.role}
                    onChange={(e) => updateMember(index, { role: e.target.value })}
                    className={attempted && !member.role.trim() ? inputErrorClass : inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Фото</label>
                  <input
                    value={member.image}
                    onChange={(e) => updateMember(index, { image: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Facebook</label>
                  <input
                    value={member.facebook || ""}
                    onChange={(e) => updateMember(index, { facebook: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Instagram</label>
                  <input
                    value={member.instagram || ""}
                    onChange={(e) => updateMember(index, { instagram: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addMember}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Додати служителя
          </button>
        </div>
      )}

      {mapLocationIndex !== null && locations[mapLocationIndex] && (
        <MapPicker
          initialAddress={locations[mapLocationIndex].address}
          initialCoordinates={locations[mapLocationIndex].coordinates}
          onSave={({ address, coordinates }: MapPickerValue) => {
            updateLocation(mapLocationIndex, { address, coordinates });
            setMapLocationIndex(null);
          }}
          onClose={() => setMapLocationIndex(null)}
        />
      )}
    </section>
  );
}
