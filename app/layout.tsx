import type { Metadata } from "next";
import "./globals.css";
import { serviceLocations, site } from "./content";

export const metadata: Metadata = {
  metadataBase: new URL("https://emmanuil.pages.dev"),
  title: "Еммануїл — євангельська церква Чернівців",
  description: "Еммануїл — християнська церква у Чернівцях: служіння, домашні групи, команда, новини та онлайн.",
  icons: {
    icon: [
      { url: "/favicon-emmanuil-dark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-emmanuil-dark.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/favicon-emmanuil-dark-32.png",
    apple: { url: "/apple-touch-icon-dark.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Еммануїл — християнська церква у Чернівцях",
    description: "Новини, служителі, домашні групи, онлайн-трансляції, контакти та реквізити церкви Еммануїл.",
    type: "website",
    locale: "uk_UA",
    images: [
      {
        url: "/og-editorial.png",
        width: 1680,
        height: 945,
        alt: "Еммануїл — християнська церква у Чернівцях",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Еммануїл — християнська церква у Чернівцях",
    description: "Новини, служителі, домашні групи, онлайн-трансляції, контакти та реквізити церкви Еммануїл.",
    images: ["/og-editorial.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "Church", "@id": `${site.canonicalUrl}/#church`, name: "Християнська церква Еммануїл", url: site.canonicalUrl, email: site.email, telephone: "+380669509977", sameAs: Object.values(site.socials), address: { "@type": "PostalAddress", streetAddress: "вул. О. Кобилянської, 53", addressLocality: "Чернівці", addressCountry: "UA" } }, ...serviceLocations.map((location) => ({ "@type": "Place", "@id": `${site.canonicalUrl}/contacts#${encodeURIComponent(location.label)}`, name: `Еммануїл — ${location.label}`, address: location.address, geo: { "@type": "GeoCoordinates", latitude: Number(location.coordinates.split(",")[0]), longitude: Number(location.coordinates.split(",")[1]) }, containedInPlace: { "@id": `${site.canonicalUrl}/#church` } }))] };
  return <html lang="uk"><head><meta name="color-scheme" content="light only" /><meta name="darkreader-lock" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Prata&display=swap" rel="stylesheet" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></head><body>{children}</body></html>;
}
