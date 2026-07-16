"use client";

import { useState } from "react";

export type MapLocation = {
  label: string;
  address: string;
};

const embedUrl = (address: string) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
const directionsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

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

  return (
    <section id={id} className={`interactive-map ${dark ? "interactive-map-dark" : ""}`}>
      <div className="interactive-map-panel">
        <p className={`overline ${dark ? "overline-light" : ""}`}>{eyebrow}</p>
        <h2>{title}</h2>
        <p className="interactive-map-description">{description}</p>
        <div className="map-location-list" aria-label="Оберіть місце на карті">
          {locations.map((item, index) => (
            <button type="button" className={selected === index ? "is-active" : ""} aria-pressed={selected === index} onClick={() => setSelected(index)} key={`${item.label}-${item.address}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <small>{item.address}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="interactive-map-stage">
        <div className="interactive-map-toolbar"><div><span>Обрана адреса</span><strong>{location.label}</strong></div><a href={directionsUrl(location.address)} target="_blank" rel="noreferrer">Прокласти маршрут <span aria-hidden="true">↗</span></a></div>
        <iframe key={location.address} src={embedUrl(location.address)} title={`${location.label} на карті`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </section>
  );
}
