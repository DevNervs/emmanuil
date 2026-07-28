"use client";

import { useEffect, useState } from "react";
import { getNextService, serviceLocations, type NextServiceSlot } from "../content";

export function NextService() {
  const [slot, setSlot] = useState<NextServiceSlot>(() => getNextService());

  useEffect(() => {
    const tick = () => setSlot(getNextService());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const locationCount = slot.locations.length;
  const locationPhrase =
    locationCount === 1 ? "1 локація" : `${locationCount} локації`;

  return (
    <section data-header-theme="light" className="home-now" aria-labelledby="home-next-title">
      <div className="home-now-heading">
        <div>
          <p className="overline">Найближче служіння</p>
          <h2 id="home-next-title">{slot.whenLabel}</h2>
          <p className="home-now-lead">
            {locationPhrase} о {slot.time}. Оберіть зручну адресу.
          </p>
        </div>
        <div className="home-now-actions">
          <a className="button button-wine" href="/visit">Що очікувати на візиті</a>
          <a className="inline-link" href="/contacts">Карта та маршрути</a>
        </div>
      </div>
      <div className="home-now-locations">
        {serviceLocations.map((location) => (
          <article key={location.label}>
            <h3>{location.label}</h3>
            <p>{location.address}</p>
            <strong>{location.time.replace("Щонеділі о ", "щонеділі ")}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
