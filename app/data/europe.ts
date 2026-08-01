export type EuropeService = {
  day: string;
  time: string;
  label: string;
};

export type EuropeLocation = {
  city: string;
  country: string;
  flag: string;
  address: string;
  mapQuery: string;
  mapsUrl: string;
  instagram: string;
  youtube?: string;
  schedule: EuropeService[];
};

export const europeLocations: EuropeLocation[] = [
  {
    city: "Брюссель",
    country: "Бельгія",
    flag: "🇧🇪",
    address: "Rue du Gaz 61, 1020 Laken, Brussels, Belgium",
    mapQuery: "Rue du Gaz 61, 1020 Laken, Brussels, Belgium",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rue%20du%20Gaz%2061%2C%201020%20Laken%2C%20Brussels%2C%20Belgium",
    instagram: "https://www.instagram.com/emmanuil.brussels/",
    schedule: [
      { day: "Неділя", time: "15:00", label: "Недільне служіння" },
      { day: "Середа", time: "20:00", label: "Молитва" },
      { day: "Пʼятниця", time: "20:30", label: "Молодіжне" },
    ],
  },
  {
    city: "Амстердам",
    country: "Нідерланди",
    flag: "🇳🇱",
    address: "Javastraat 118, 1094 HP Amsterdam, Netherlands",
    mapQuery: "Javastraat 118, 1094 HP Amsterdam, Netherlands",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Javastraat%20118%2C%201094%20HP%20Amsterdam%2C%20Netherlands",
    instagram: "https://www.instagram.com/emmanuil.amsterdam/",
    schedule: [
      { day: "Неділя", time: "17:00", label: "Недільне служіння" },
      { day: "Субота", time: "18:30", label: "Молодіжне" },
    ],
  },
  {
    city: "Гент",
    country: "Бельгія",
    flag: "🇧🇪",
    address: "Keizer Karelstraat 187, 9000 Gent, Belgium",
    mapQuery: "Keizer Karelstraat 187, 9000 Gent, Belgium",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Keizer%20Karelstraat%20187%2C%209000%20Gent%2C%20Belgium",
    instagram: "https://www.instagram.com/emmanuil.gent/",
    schedule: [
      { day: "Неділя", time: "18:30", label: "Недільне служіння" },
    ],
  },
];
