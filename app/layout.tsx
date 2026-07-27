import type { Metadata } from "next";
import "./globals.css";
import { site } from "./content";
import { absoluteUrl, buildSiteGraph, seoKeywords, shareImageUrl } from "./seo";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(site.canonicalUrl),
  applicationName: "Християнська церква Еммануїл Чернівці",
  title: {
    default: "Церква Еммануїл у Чернівцях | Християнська євангельська церква",
    template: "%s | Церква Еммануїл Чернівці",
  },
  description:
    "Християнська євангельська церква Еммануїл у Чернівцях. Недільні служіння о 10:00 та 17:00 на 4 локаціях, домашні групи, онлайн-трансляції, адреси та контакти.",
  keywords: seoKeywords,
  category: "religion",
  creator: site.legalName,
  publisher: site.legalName,
  authors: [{ name: site.legalName, url: absoluteUrl("/") }],
  alternates: {
    canonical: "/",
    languages: { "uk-UA": "/", uk: "/" },
  },
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
  verification: {
    ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
    ...(yandexVerification ? { yandex: yandexVerification } : {}),
    ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {}),
  },
  icons: {
    icon: [
      { url: "/favicon-emmanuil-dark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-emmanuil-dark.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/favicon-emmanuil-dark-32.png",
    apple: { url: "/apple-touch-icon-dark.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    url: absoluteUrl("/"),
    siteName: "Церква Еммануїл Чернівці",
    title: "Еммануїл — християнська церква у Чернівцях",
    description:
      "Недільні служіння о 10:00 та 17:00 на 4 локаціях у Чернівцях і області, домашні групи, онлайн-трансляції та контакти.",
    type: "website",
    locale: "uk_UA",
    alternateLocale: ["ru_UA"],
    images: [
      {
        url: shareImageUrl(),
        secureUrl: shareImageUrl(),
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: "Еммануїл — християнська церква у Чернівцях",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Еммануїл — християнська церква у Чернівцях",
    description:
      "Недільні служіння, домашні групи, онлайн-трансляції та контакти християнської церкви Еммануїл.",
    images: [shareImageUrl()],
  },
  other: {
    "geo.region": site.geo.region,
    "geo.placename": site.geo.placename,
    "geo.position": `${site.geo.latitude};${site.geo.longitude}`,
    ICBM: `${site.geo.latitude}, ${site.geo.longitude}`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = buildSiteGraph();
  const ogImage = shareImageUrl();
  return (
    <html lang="uk">
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="darkreader-lock" />
        <link rel="image_src" href={ogImage} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content={ogImage} />
        <link rel="preload" href="/fonts/Moula.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Unbounded-Medium.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;d.classList.add("hdr-boot");if((window.scrollY||d.scrollTop)>=72)d.classList.add("hdr-compact");}catch(e){}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
