"use client";

import { useSiteConfig } from "./SiteConfig";

export function HeroLocations() {
  const { config } = useSiteConfig();
  const locations = config.serviceLocations ?? [];

  return (
    <div className="hero-locations-bar">
      <div className="hero-locations-header">
        <span className="hero-locations-title">Найближчі служіння</span>
        <a className="hero-locations-link" href="/contacts/">
          Карта та маршрути →
        </a>
      </div>
      <div className="hero-locations-grid">
        {locations.map((loc) => (
          <a
            key={loc.label}
            className="hero-location-card"
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.coordinates)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Прокласти маршрут у Google Maps: ${loc.address}`}
          >
            <strong>{loc.streetAddress}</strong>
            {loc.addressLocality !== "Чернівці" && (
              <span className="hero-location-city">м. {loc.addressLocality}</span>
            )}
            <time>{loc.time}</time>
          </a>
        ))}
      </div>
    </div>
  );
}
