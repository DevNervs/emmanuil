export type ServiceLocation = {
  label: string;
  address: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  time: string;
  coordinates: string;
  mapsUrl: string;
};

export const serviceLocations: ServiceLocation[] = [
  { label: "Криворучка", address: "м. Чернівці, вул. Ореста Криворучка, 57", streetAddress: "вул. Ореста Криворучка, 57", addressLocality: "Чернівці", addressRegion: "Чернівецька область", time: "Щонеділі о 10:00", coordinates: "48.278415,25.919215", mapsUrl: "https://maps.app.goo.gl/Kn2Rhhko4CtXmfai7" },
  { label: "Кобилянська", address: "м. Чернівці, вул. Ольги Кобилянської, 53", streetAddress: "вул. Ольги Кобилянської, 53", addressLocality: "Чернівці", addressRegion: "Чернівецька область", time: "Щонеділі о 17:00", coordinates: "48.2863973,25.9391673", mapsUrl: "https://maps.app.goo.gl/1LR286JNGhsnWYvc9" },
  { label: "Садгора", address: "м. Чернівці, вул. Васіле Александрі, 8", streetAddress: "вул. Васіле Александрі, 8", addressLocality: "Чернівці", addressRegion: "Чернівецька область", time: "Щонеділі о 10:00", coordinates: "48.3466606,25.9587955", mapsUrl: "https://maps.app.goo.gl/4BVc4ECUffBAWZ7v5" },
  { label: "Сторожинець", address: "м. Сторожинець, вул. Українська, 5", streetAddress: "вул. Українська, 5", addressLocality: "Сторожинець", addressRegion: "Чернівецька область", time: "Щонеділі о 10:00", coordinates: "48.1638107,25.7223761", mapsUrl: "https://maps.app.goo.gl/7MJcFzQQ1egFEYkj6" },
];
