"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search, Trash2, X } from "lucide-react";
import type { LeafletMouseEvent, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPickerValue = {
  address: string;
  coordinates: string;
};

type MapPickerProps = {
  initialAddress?: string;
  initialCoordinates?: string;
  onSave: (value: MapPickerValue) => void;
  onClose?: () => void;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    osm_id?: number;
    osm_type?: string;
  };
};

const DEFAULT_CENTER: [number, number] = [48.2864, 25.9392];

function parseCoords(value: string): [number, number] | null {
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !part)) return null;

  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }
  return [lat, lon];
}

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function formatAddress(feature: PhotonFeature): string {
  const properties = feature.properties ?? {};
  const parts: string[] = [];
  const street = [properties.street, properties.housenumber]
    .filter(Boolean)
    .join(" ");

  if (properties.name && properties.name !== properties.street) {
    parts.push(properties.name);
  }
  if (street) parts.push(street);
  if (properties.district) parts.push(properties.district);
  if (properties.city) parts.push(properties.city);
  else if (properties.county) parts.push(properties.county);
  if (properties.country) parts.push(properties.country);

  return [...new Set(parts)].join(", ") || properties.name || "";
}

function getFeatureCoordinates(feature: PhotonFeature): [number, number] | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;
  const [lon, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return [lat, lon];
}

export function MapPicker({
  initialAddress = "",
  initialCoordinates = "",
  onSave,
  onClose,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LeafletMap | null>(null);
  const leafletModule = useRef<typeof import("leaflet") | null>(null);
  const marker = useRef<LeafletMarker | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchController = useRef<AbortController | null>(null);

  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [query, setQuery] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [results, setResults] = useState<PhotonFeature[]>([]);

  const selectedCoordinates = parseCoords(coordinates);

  const setPositionFromCoords = useCallback(async (lat: number, lon: number) => {
    const nextCoordinates = formatCoords(lat, lon);
    setCoordinates(nextCoordinates);
    setSearchMessage("Уточнюємо адресу…");

    try {
      const response = await fetch(
        `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&limit=1`,
      );
      if (!response.ok) throw new Error("reverse geocoding failed");
      const data = (await response.json()) as { features?: PhotonFeature[] };
      const nextAddress = data.features?.[0]
        ? formatAddress(data.features[0])
        : "";
      if (nextAddress) {
        setAddress(nextAddress);
        setQuery(nextAddress);
        setSearchMessage("Точку вибрано. За потреби відредагуйте адресу нижче.");
      } else {
        setSearchMessage("Точку вибрано. Введіть адресу вручну.");
      }
    } catch {
      setSearchMessage("Точку вибрано. Адресу не вдалося визначити — введіть її вручну.");
    }
  }, []);

  const ensureMarker = useCallback((lat: number, lon: number, zoom = 16) => {
    const map = leafletMap.current;
    const L = leafletModule.current;
    if (!map || !L) return;

    if (!marker.current) {
      const icon = L.divIcon({
        className: "map-picker-marker",
        html: '<span class="map-picker-marker__pin"><span></span></span>',
        iconSize: [38, 46],
        iconAnchor: [19, 44],
      });
      const nextMarker = L.marker([lat, lon], {
        icon,
        draggable: true,
        keyboard: true,
        title: "Місце зустрічі. Перетягніть, щоб уточнити точку.",
      }).addTo(map);
      nextMarker.on("dragend", () => {
        const position = nextMarker.getLatLng();
        void setPositionFromCoords(position.lat, position.lng);
      });
      marker.current = nextMarker;
    } else {
      marker.current.setLatLng([lat, lon]);
    }

    map.setView([lat, lon], zoom);
  }, [setPositionFromCoords]);

  const applyFeature = (feature: PhotonFeature) => {
    const position = getFeatureCoordinates(feature);
    if (!position) {
      setSearchMessage("Цей результат не містить координат. Оберіть інший.");
      return;
    }

    const [lat, lon] = position;
    ensureMarker(lat, lon);
    setCoordinates(formatCoords(lat, lon));
    const nextAddress = formatAddress(feature);
    if (nextAddress) {
      setAddress(nextAddress);
      setQuery(nextAddress);
    }
    setResults([]);
    setSearchMessage("Точку вибрано. Перевірте адресу та натисніть «Застосувати».");
  };

  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;
    let map: LeafletMap | null = null;

    const init = async () => {
      try {
        const L = await import("leaflet");
        if (!mounted || !mapRef.current) return;

        leafletModule.current = L;
        const initialPosition = parseCoords(initialCoordinates);
        const center = initialPosition ?? DEFAULT_CENTER;
        map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
        }).setView(center, initialPosition ? 16 : 13);
        leafletMap.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        map.on("click", (event: LeafletMouseEvent) => {
          const { lat, lng } = event.latlng;
          ensureMarker(lat, lng);
          void setPositionFromCoords(lat, lng);
        });

        if (initialPosition) {
          ensureMarker(initialPosition[0], initialPosition[1]);
        }

        setMapReady(true);
        requestAnimationFrame(() => map?.invalidateSize());
        setTimeout(() => map?.invalidateSize(), 120);
      } catch {
        if (mounted) {
          setMapError("Карту не вдалося завантажити. Спробуйте закрити її та відкрити ще раз.");
        }
      }
    };

    void init();
    searchInput.current?.focus();

    return () => {
      mounted = false;
      searchController.current?.abort();
      marker.current = null;
      leafletMap.current = null;
      leafletModule.current = null;
      map?.remove();
    };
  }, [ensureMarker, initialCoordinates, setPositionFromCoords]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const searchQuery = query.trim();
    if (!searchQuery) return;

    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setLoading(true);
    setResults([]);
    setSearchMessage("");

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=${DEFAULT_CENTER[0]}&lon=${DEFAULT_CENTER[1]}&limit=6`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("geocoding failed");
      const data = (await response.json()) as { features?: PhotonFeature[] };
      const nextResults = (data.features ?? []).filter(getFeatureCoordinates);

      if (!nextResults.length) {
        setSearchMessage("Нічого не знайдено. Спробуйте вулицю з номером будинку або поставте точку на карті.");
      } else if (nextResults.length === 1) {
        applyFeature(nextResults[0]);
      } else {
        setResults(nextResults);
        setSearchMessage("Оберіть правильний варіант зі списку.");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setSearchMessage("Пошук зараз недоступний. Поставте точку на карті або спробуйте ще раз.");
      }
    } finally {
      if (searchController.current === controller) setLoading(false);
    }
  };

  const handleClear = () => {
    marker.current?.remove();
    marker.current = null;
    setCoordinates("");
    setAddress("");
    setQuery("");
    setResults([]);
    setSearchMessage("Точку видалено.");
    leafletMap.current?.setView(DEFAULT_CENTER, 13);
    searchInput.current?.focus();
  };

  const handleSave = () => {
    if (!selectedCoordinates) return;
    onSave({ address: address.trim(), coordinates: coordinates.trim() });
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[94vh] sm:rounded-3xl sm:border sm:border-[var(--line)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-picker-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">
              Місце зустрічі
            </p>
            <h2 id="map-picker-title" className="font-[var(--serif)] text-xl font-semibold text-[var(--ink)] sm:text-2xl">
              Вкажіть точку на карті
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Знайдіть адресу або натисніть у потрібному місці. Позначку можна перетягнути для точності.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
            aria-label="Закрити карту"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
          <div className="order-2 flex flex-col gap-4 overflow-y-auto border-t border-[var(--line)] p-5 sm:p-6 lg:order-1 lg:border-r lg:border-t-0">
            <form onSubmit={handleSearch}>
              <label htmlFor="map-search" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Пошук адреси
              </label>
              <div className="flex gap-2">
                <input
                  ref={searchInput}
                  id="map-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Наприклад: Героїв Майдану, 109"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--wine)] text-white transition-colors hover:bg-[var(--wine-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Знайти адресу"
                >
                  {loading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </form>

            {searchMessage && (
              <p className="rounded-xl bg-[var(--paper)] px-3 py-2.5 text-sm leading-relaxed text-[var(--muted)]" aria-live="polite">
                {searchMessage}
              </p>
            )}

            {results.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
                {results.map((feature, index) => (
                  <button
                    key={`${feature.properties?.osm_type ?? "place"}-${feature.properties?.osm_id ?? index}`}
                    type="button"
                    onClick={() => applyFeature(feature)}
                    className="flex w-full items-start gap-2 border-b border-[var(--line)] px-3 py-3 text-left text-sm text-[var(--ink)] transition-colors last:border-0 hover:bg-[var(--rose)]"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--wine)]" aria-hidden="true" />
                    <span>{formatAddress(feature)}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="selected-address" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Адреса для відвідувачів
              </label>
              <textarea
                id="selected-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="З’явиться після вибору точки. Можна виправити вручну."
                rows={3}
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
              />
            </div>

            <div className={`rounded-xl border p-3 ${selectedCoordinates ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${selectedCoordinates ? "text-emerald-700" : "text-amber-700"}`}>
                {selectedCoordinates ? "Точку вибрано" : "Точку ще не вибрано"}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-slate-600">
                {coordinates || "Натисніть на карту або знайдіть адресу"}
              </p>
            </div>

            {selectedCoordinates && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Видалити точку
              </button>
            )}
          </div>

          <div className="relative order-1 min-h-[20rem] bg-slate-100 lg:order-2 lg:min-h-[34rem]">
            {!mapReady && !mapError && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-slate-100 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Завантажуємо карту…
                </span>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 z-10 grid place-items-center p-6 text-center text-sm text-red-700">
                {mapError}
              </div>
            )}
            <div ref={mapRef} className="h-full min-h-[20rem] w-full lg:min-h-[34rem]" aria-label="Карта вибору місця зустрічі" />
            {mapReady && !selectedCoordinates && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-center text-xs font-medium text-slate-700 shadow-lg">
                Натисніть на карту, щоб поставити позначку
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--line)] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedCoordinates}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--wine)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Застосувати місце
          </button>
        </footer>
      </section>
    </div>
  );
}
