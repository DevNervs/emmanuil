import type { Metadata } from "next";
import { news, serviceLocations, site, visitFaq, type ServiceLocation } from "./content";

export const seoKeywords = [
  "церква Чернівці",
  "християнська церква Чернівці",
  "євангельська церква Чернівці",
  "церква Еммануїл",
  "Еммануїл Чернівці",
  "недільне служіння Чернівці",
  "домашні групи Чернівці",
  "церква Садгора",
  "церква Сторожинець",
  "церковь Черновцы",
  "Эммануил Черновцы",
  "Emmanuil Chernivtsi",
  "church Chernivtsi",
];

export const siteRoutes = [
  { path: "", priority: 1, changeFrequency: "weekly" as const, lastModified: "2026-07-23" },
  { path: "/visit", priority: 0.95, changeFrequency: "monthly" as const, lastModified: "2026-07-23" },
  { path: "/contacts", priority: 0.95, changeFrequency: "monthly" as const, lastModified: "2026-07-23" },
  { path: "/groups", priority: 0.9, changeFrequency: "weekly" as const, lastModified: "2026-07-23" },
  { path: "/online", priority: 0.85, changeFrequency: "weekly" as const, lastModified: "2026-07-23" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const, lastModified: "2026-07-23" },
  { path: "/virovchennja", priority: 0.75, changeFrequency: "yearly" as const, lastModified: "2026-07-23" },
  { path: "/team", priority: 0.7, changeFrequency: "monthly" as const, lastModified: "2026-07-23" },
  { path: "/news", priority: 0.7, changeFrequency: "weekly" as const, lastModified: "2026-07-23" },
  { path: "/donate", priority: 0.65, changeFrequency: "yearly" as const, lastModified: "2026-07-23" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const, lastModified: "2026-07-23" },
];

/** Canonical social share image (1200×630 JPEG in public/). Query busts Telegram/Facebook caches. */
export const OG_SHARE_IMAGE_PATH = "/share-card.jpg";
export const OG_SHARE_IMAGE_VERSION = "20260724";

export function shareImageUrl(): string {
  return absoluteUrl(`${OG_SHARE_IMAGE_PATH}?v=${OG_SHARE_IMAGE_VERSION}`);
}

function defaultOgImages() {
  const url = shareImageUrl();
  return [
    {
      url,
      secureUrl: url,
      type: "image/jpeg" as const,
      width: 1200,
      height: 630,
      alt: "Еммануїл — християнська церква у Чернівцях",
    },
  ];
}

/** Absolute URL. HTML routes use a trailing slash to match Cloudflare Pages directory URLs. */
export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return `${site.canonicalUrl}/`;
  const raw = path.startsWith("/") ? path : `/${path}`;
  const hashIndex = raw.indexOf("#");
  const queryIndex = raw.indexOf("?");
  let pathname = raw;
  let suffix = "";
  if (hashIndex >= 0) {
    pathname = raw.slice(0, hashIndex);
    suffix = raw.slice(hashIndex);
  } else if (queryIndex >= 0) {
    pathname = raw.slice(0, queryIndex);
    suffix = raw.slice(queryIndex);
  }
  // Keep real files (images, pdf, xml, txt, …) without a forced trailing slash.
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return `${site.canonicalUrl}${pathname}${suffix}`;
  }
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return `${site.canonicalUrl}${withSlash}${suffix}`;
}

type PageMetaInput = {
  path: string;
  title: string | { absolute: string };
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  type?: "website" | "article";
  publishedTime?: string;
  images?: Array<string | { url: string; alt?: string }>;
};

/** Unique title/description/canonical/OG/Twitter for each public route. */
export function pageMetadata({
  path,
  title,
  description,
  ogTitle,
  ogDescription,
  type = "website",
  publishedTime,
  images,
}: PageMetaInput): Metadata {
  const rawPath = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  // Prefer trailing-slash HTML URLs (Cloudflare Pages serves /visit/ → visit/index.html).
  const canonicalPath = rawPath === "/" || rawPath.endsWith("/") || /\.[a-z0-9]+$/i.test(rawPath) ? rawPath : `${rawPath}/`;
  const shareTitle = ogTitle || (typeof title === "string" ? title : title.absolute);
  const shareDescription = ogDescription || description;
  const ogImages = images?.length
    ? images.map((image) => {
        if (typeof image === "string") {
          const url = image.startsWith("http") ? image : absoluteUrl(image);
          return { url, secureUrl: url, type: "image/jpeg" as const, width: 1200, height: 630 };
        }
        const url = image.url.startsWith("http") ? image.url : absoluteUrl(image.url);
        return {
          url,
          secureUrl: url,
          type: "image/jpeg" as const,
          width: 1200,
          height: 630,
          ...(image.alt ? { alt: image.alt } : {}),
        };
      })
    : defaultOgImages();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: { "uk-UA": canonicalPath, uk: canonicalPath },
    },
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url: canonicalPath,
      siteName: "Церква Еммануїл Чернівці",
      locale: "uk_UA",
      type,
      ...(publishedTime ? { publishedTime } : {}),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: ogImages.map((image) => (typeof image.url === "string" ? image.url : String(image.url))),
    },
  };
}

export function buildBreadcrumbList(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function breadcrumbFor(path: string, name: string) {
  return buildBreadcrumbList([
    { name: "Головна", path: "/" },
    { name, path },
  ]);
}

function serviceOpens(time: string): string {
  const match = time.match(/(\d{1,2}:\d{2})/);
  return match?.[1] ?? "10:00";
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const next = (h + hours) % 24;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function openingHoursFor(location: ServiceLocation) {
  const opens = serviceOpens(location.time);
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "Sunday",
    opens,
    closes: addHours(opens, 2),
  };
}

export function buildSiteGraph() {
  const organizationId = absoluteUrl("/#organization");
  const websiteId = absoluteUrl("/#website");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: site.legalName,
        legalName: site.legalName,
        alternateName: [
          "Церква Еммануїл Чернівці",
          "Еммануїл Чернівці",
          "Эммануил Черновцы",
          "Emmanuil Chernivtsi",
          "Emmanuel Church Chernivtsi",
        ],
        url: absoluteUrl("/"),
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/emmanuil-logo-hq.png"),
          width: 2172,
          height: 216,
        },
        image: shareImageUrl(),
        email: site.email,
        telephone: site.phoneE164,
        foundingLocation: {
          "@type": "Place",
          name: "Чернівці",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Чернівці",
            addressRegion: "Чернівецька область",
            addressCountry: "UA",
          },
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: "вул. Ольги Кобилянської, 53",
          addressLocality: "Чернівці",
          addressRegion: "Чернівецька область",
          addressCountry: "UA",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: site.phoneE164[0],
            contactType: "customer service",
            areaServed: "UA",
            availableLanguage: ["uk", "ru"],
          },
          {
            "@type": "ContactPoint",
            telephone: site.phoneE164[1],
            contactType: "customer service",
            areaServed: "UA",
            availableLanguage: ["uk", "ru"],
          },
        ],
        sameAs: Object.values(site.socials),
        areaServed: [
          { "@type": "City", name: "Чернівці" },
          { "@type": "AdministrativeArea", name: "Чернівецька область" },
          { "@type": "Country", name: "Україна" },
        ],
        knowsAbout: [
          "християнське служіння",
          "євангельська церква",
          "домашні групи",
          "недільні богослужіння",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: absoluteUrl("/"),
        name: "Церква Еммануїл Чернівці",
        alternateName: ["Emmanuil Chernivtsi", "Эммануил Черновцы"],
        description:
          "Офіційний сайт християнської євангельської церкви Еммануїл у Чернівцях: адреси служінь, домашні групи, онлайн-трансляції та контакти.",
        inLanguage: ["uk-UA", "uk"],
        publisher: { "@id": organizationId },
        about: { "@id": organizationId },
      },
      ...serviceLocations.map((location) => {
        const [latitude, longitude] = location.coordinates.split(",").map(Number);
        const locationId = absoluteUrl(`/contacts#${encodeURIComponent(location.label)}`);
        return {
          "@type": ["Church", "PlaceOfWorship", "LocalBusiness"],
          "@id": locationId,
          name: `${site.legalName} — ${location.label}`,
          alternateName: [
            `Церква Еммануїл, ${location.addressLocality}`,
            `Християнська церква Еммануїл ${location.label}`,
          ],
          url: locationId,
          image: shareImageUrl(),
          logo: absoluteUrl("/emmanuil-logo-hq.png"),
          email: site.email,
          telephone: site.phoneE164[0],
          address: {
            "@type": "PostalAddress",
            streetAddress: location.streetAddress,
            addressLocality: location.addressLocality,
            addressRegion: location.addressRegion,
            addressCountry: "UA",
          },
          geo: { "@type": "GeoCoordinates", latitude, longitude },
          hasMap: location.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.coordinates)}`,
          openingHoursSpecification: openingHoursFor(location),
          isAccessibleForFree: true,
          publicAccess: true,
          parentOrganization: { "@id": organizationId },
          sameAs: Object.values(site.socials),
          areaServed: {
            "@type": "City",
            name: location.addressLocality,
          },
        };
      }),
    ],
  };
}

export function buildFaqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": absoluteUrl("/visit#faq"),
    url: absoluteUrl("/visit"),
    mainEntity: visitFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function buildSitemapEntries() {
  return [
    ...siteRoutes.map((route) => ({
      url: absoluteUrl(route.path || "/"),
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...news.map((item) => ({
      url: absoluteUrl(`/news/${item.slug}`),
      lastModified: item.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.55,
    })),
  ];
}

export function buildSitemapXml(): string {
  const urls = buildSitemapEntries()
    .map((entry) => {
      const priority = Number.isInteger(entry.priority) ? entry.priority.toFixed(1) : String(entry.priority);
      return `  <url><loc>${entry.url}</loc><lastmod>${entry.lastModified}</lastmod><changefreq>${entry.changeFrequency}</changefreq><priority>${priority}</priority></url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobotsTxt(): string {
  const host = site.canonicalUrl.replace(/^https?:\/\//, "");
  return `User-agent: *\nAllow: /\n\nHost: ${host}\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`;
}
