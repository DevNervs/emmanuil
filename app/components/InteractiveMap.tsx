"use client";

import { useState } from "react";

export type MapLocation = {
  label: string;
  address: string;
  mapQuery?: string;
  coordinates?: string;
  mapsUrl?: string;
};

const embedUrl = (query: string, coordinates?: string) => `https://www.google.com/maps?q=${encodeURIComponent(coordinates ?? query)}&z=17&output=embed`;
const directionsUrl = (item: MapLocation) => {
  if (item.mapsUrl) return item.mapsUrl;
  if (item.coordinates) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.coordinates)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery ?? item.address)}`;
};

export function InteractiveMap({ id, eyebrow, title, description, locations, dark = false }: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  locations: MapLocation[];
  dark?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const location = locations[selected];
  const mapQuery = location.mapQuery ?? location.address;
  const markerKey = location.coordinates ?? mapQuery;

  return (
    <section id={id} data-header-theme={dark ? "dark" : "light"} className={`interactive-map ${dark ? "interactive-map-dark" : ""}`}>
      <div className="interactive-map-panel">
        <p className={`overline ${dark ? "overline-light" : ""}`}>{eyebrow}</p>
        <h2>{title}</h2>
        <p className="interactive-map-description">{description}</p>
        <div className="map-location-list" aria-label="Оберіть місце на карті">
          {locations.map((item, index) => (
            <div className={`map-location-item ${selected === index ? "is-active" : ""}`} key={`${item.label}-${item.address}`}>
              <button type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.label}</strong>
                <small>{item.address}</small>
              </button>
              <a href={directionsUrl(item)} target="_blank" rel="noopener noreferrer" aria-label={`Прокласти маршрут: ${item.label}`}>Прокласти маршрут <span aria-hidden="true">↗</span></a>
            </div>
          ))}
        </div>
      </div>
      <div className="interactive-map-stage">
        <div className="interactive-map-toolbar"><div><span>Обрана адреса</span><strong>{location.label}</strong></div><a href={directionsUrl(location)} target="_blank" rel="noopener noreferrer">Прокласти маршрут <span aria-hidden="true">↗</span></a></div>
        <iframe key={markerKey} src={embedUrl(mapQuery, location.coordinates)} title={`${location.label} на карті`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </section>
  );
}
