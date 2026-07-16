import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://emmanuil.pages.dev"),
  title: "Еммануїл — євангельська церква Чернівців",
  description: "Еммануїл — християнська церква у Чернівцях: служіння, домашні групи, команда, новини та онлайн.",
  icons: {
    icon: [
      { url: "/favicon-emmanuil-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-emmanuil.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/favicon-emmanuil-32.png",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
  const organization = { "@context": "https://schema.org", "@type": "Church", name: "Християнська церква Еммануїл", url: "https://emmanuil.pages.dev", email: "emmanuil.cv@gmail.com", telephone: "+380669509977", address: { "@type": "PostalAddress", streetAddress: "вул. О. Кобилянської, 53", addressLocality: "Чернівці", addressCountry: "UA" } };
  return <html lang="uk"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Prata&display=swap" rel="stylesheet" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} /></head><body>{children}</body></html>;
}
