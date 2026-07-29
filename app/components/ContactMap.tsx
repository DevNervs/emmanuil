"use client";

import { useMemo } from "react";
import { InteractiveMap } from "./InteractiveMap";
import { useSiteConfig } from "./SiteConfig";

export function ContactMap() {
  const { config } = useSiteConfig();

  const locations = useMemo(() => [
    ...config.serviceLocations.map((location) => ({
      ...location,
      mapQuery: location.address,
    })),
    {
      label: "Реабілітаційний центр",
      address: "с. Великий Кучурів, Чернівецька обл.",
      mapQuery: "Великий Кучурів, Чернівецький район, Чернівецька область, Україна",
      coordinates: "48.21543,25.910825",
      mapsUrl: "https://maps.app.goo.gl/C65CdZUqP8ChXojk8",
    },
  ], [config.serviceLocations]);

  return (
    <InteractiveMap
      id="contacts-map"
      eyebrow="Місцезнаходження"
      title="Знайти нас на карті"
      description="Оберіть потрібну адресу в Чернівцях або Чернівецькій області. Для кожної точки можна одразу відкрити точний маршрут."
      locations={locations}
    />
  );
}
