"use client";

import { useEffect, useRef, useState } from "react";
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

function parseCoords(value: string): [number, number] | null {
  const [latStr, lonStr] = value.split(",").map((s) => s.trim());
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
  return null;
}

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function formatAddress(feature: any): string {
  const p = feature?.properties || {};
  const parts: string[] = [];
  if (p.name && p.name !== p.street) parts.push(p.name);
  if (p.street) {
    parts.push(`${p.street}${p.housenumber ? ` ${p.housenumber}` : ""}`);
  }
  if (p.city) parts.push(p.city);
  if (p.country) parts.push(p.country);
  return parts.join(", ") || p.name || "";
}

export function MapPicker({
  initialAddress = "",
  initialCoordinates = "",
  onSave,
  onClose,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);

  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultCenter: [number, number] = [48.2864, 25.9392];

  const setPositionFromCoords = async (lat: number, lon: number) => {
    setCoordinates(formatCoords(lat, lon));
    try {
      const res = await fetch(
        `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&limit=1`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const feature = data.features?.[0];
      if (feature) {
        const addr = formatAddress(feature);
        if (addr) setAddress(addr);
      }
    } catch {
      // ignore reverse-geocoding errors
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;
    let map: any = null;

    const init = async () => {
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;

      const center = parseCoords(coordinates) || defaultCenter;
      map = L.map(mapRef.current).setView(center, 14);
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const m = L.marker(center, { draggable: true }).addTo(map);
      marker.current = m;

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        m.setLatLng([lat, lng]);
        map.panTo([lat, lng]);
        await setPositionFromCoords(lat, lng);
      });

      m.on("dragend", () => {
        const { lat, lng } = m.getLatLng();
        setPositionFromCoords(lat, lng);
      });
    };

    init();

    return () => {
      mounted = false;
      if (map) {
        map.remove();
      }
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`,
      );
      if (!res.ok) throw new Error("geocoding failed");
      const data = await res.json();
      const feature = data.features?.[0];
      if (feature) {
        const [lon, lat] = feature.geometry.coordinates;
        if (leafletMap.current && marker.current) {
          marker.current.setLatLng([lat, lon]);
          leafletMap.current.setView([lat, lon], 16);
        }
        setCoordinates(formatCoords(lat, lon));
        const addr = formatAddress(feature);
        if (addr) setAddress(addr);
      }
    } catch {
      // ignore search errors
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave({ address, coordinates });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-4xl flex-col rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xl">
        <form
          onSubmit={handleSearch}
          className="mb-3 flex flex-wrap items-end gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введіть адресу..."
            className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--wine)] focus:outline-none focus:ring-2 focus:ring-[var(--rose)]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Пошук..." : "Знайти"}
          </button>
        </form>

        <div
          ref={mapRef}
          className="h-80 w-full rounded-xl border border-[var(--line)] md:h-96"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-[var(--muted)]">
            <p className="truncate">{address || "—"}</p>
            <p className="truncate font-mono">{coordinates || "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--wine)] hover:text-[var(--wine)]"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--wine-dark)]"
            >
              Застосувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
