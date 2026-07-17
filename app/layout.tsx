import type { Metadata } from "next";
import "./globals.css";
import { serviceLocations, site } from "./content";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(site.canonicalUrl),
  applicationName: "Християнська церква Еммануїл Чернівці",
  title: {
    default: "Церква Еммануїл у Чернівцях | Християнська церква",
    template: "%s | Церква Еммануїл Чернівці",
  },
  description: "Християнська євангельська церква Еммануїл у Чернівцях. Адреси й час недільних служінь, домашні групи, онлайн-трансляції та контакти.",
  category: "religion",
  creator: "Християнська церква Еммануїл",
  publisher: "Християнська церква Еммануїл",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleSiteVerification ? { google: googleSiteVerification } : undefined,
  other: bingSiteVerification ? { "msvalidate.01": bingSiteVerification } : undefined,
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
    url: site.canonicalUrl,
    siteName: "Церква Еммануїл Чернівці",
    title: "Церква Еммануїл у Чернівцях",
    description: "Адреси й час служінь, домашні групи, онлайн-трансляції та контакти християнської церкви Еммануїл.",
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
    title: "Церква Еммануїл у Чернівцях",
    description: "Адреси й час служінь, домашні групи, онлайн-трансляції та контакти християнської церкви Еммануїл.",
    images: ["/og-editorial.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationId = `${site.canonicalUrl}/#organization`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Християнська церква Еммануїл",
        alternateName: ["Церква Еммануїл Чернівці", "Эммануил Черновцы", "Emmanuil Chernivtsi", "Emmanuel Church Chernivtsi"],
        url: site.canonicalUrl,
        logo: `${site.canonicalUrl}/emmanuil-logo-hq.png`,
        image: `${site.canonicalUrl}/og-editorial.png`,
        email: site.email,
        telephone: "+380669509977",
        sameAs: Object.values(site.socials),
        areaServed: [{ "@type": "City", name: "Чернівці" }, { "@type": "AdministrativeArea", name: "Чернівецька область" }, { "@type": "Country", name: "Україна" }],
      },
      {
        "@type": "WebSite",
        "@id": `${site.canonicalUrl}/#website`,
        url: site.canonicalUrl,
        name: "Церква Еммануїл Чернівці",
        alternateName: "Emmanuil Chernivtsi",
        inLanguage: "uk-UA",
        publisher: { "@id": organizationId },
      },
      ...serviceLocations.map((location) => {
        const [latitude, longitude] = location.coordinates.split(",").map(Number);
        const locationId = `${site.canonicalUrl}/contacts#${encodeURIComponent(location.label)}`;
        return {
          "@type": ["Church", "LocalBusiness"],
          "@id": locationId,
          name: `Церква Еммануїл — ${location.label}`,
          alternateName: `Християнська церква Еммануїл, ${location.addressLocality}`,
          url: locationId,
          image: `${site.canonicalUrl}/og-editorial.png`,
          logo: `${site.canonicalUrl}/emmanuil-logo-hq.png`,
          email: site.email,
          telephone: "+380669509977",
          address: {
            "@type": "PostalAddress",
            streetAddress: location.streetAddress,
            addressLocality: location.addressLocality,
            addressRegion: location.addressRegion,
            addressCountry: "UA",
          },
          geo: { "@type": "GeoCoordinates", latitude, longitude },
          hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.coordinates)}`,
          parentOrganization: { "@id": organizationId },
          sameAs: Object.values(site.socials),
        };
      }),
    ],
  };
  return <html lang="uk"><head><meta name="color-scheme" content="light only" /><meta name="darkreader-lock" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Prata&display=swap" rel="stylesheet" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></head><body>{children}</body></html>;
}
