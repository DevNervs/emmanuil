/**
 * Domain switch (one place):
 * 1) Set NEXT_PUBLIC_SITE_URL=https://emmanuil.cv.ua in env, OR
 * 2) Change DEFAULT_SITE_ORIGIN below to https://emmanuil.cv.ua
 * Then rebuild + redeploy. Canonical, sitemap, OG, JSON-LD all follow this.
 */
export const DEFAULT_SITE_ORIGIN = "https://emmanuil.pages.dev";

export const site = {
  name: "Еммануїл",
  legalName: "Християнська церква Еммануїл",
  shortName: "EmmanuilCv",
  address: "м. Чернівці, вул. О. Кобилянської, 53",
  secondAddress: "м. Чернівці, вул. О. Криворучка, 57",
  phones: ["(066) 950 99 77", "(096) 950 99 77"],
  phoneE164: ["+380669509977", "+380969509977"],
  email: "emmanuil.cv@gmail.com",
  services: "Щонеділі о 10:00 та 17:00",
  /** Production origin used by canonical / sitemap / OG / schema. */
  canonicalUrl: (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN).replace(/\/$/, ""),
  /** Old / alternate hosts (for Search Console migration notes). Not used as canonical. */
  legacyOrigins: ["https://emmanuil.cv.ua", "http://emmanuil.cv.ua"],
  geo: {
    latitude: 48.2863973,
    longitude: 25.9391673,
    region: "UA-77",
    placename: "Чернівці",
    country: "UA",
  },
  socials: {
    facebook: "https://www.facebook.com/emmanuil.cv.ua",
    instagram: "https://www.instagram.com/emmanuilcv/",
    youtube: "https://www.youtube.com/@EmmanuilCV",
    telegram: "https://t.me/emmanuilcv",
    viber: "https://invite.viber.com/?g2=AQAe6QfRzoySXEs%2FGBAO9%2Bc5IIwOyE3n6Dedj0owub6XcDOVqmwOBCpCTdx1DkGu",
  },
};

export const announcement: { text: string; href?: string } | null = null;
// Set to e.g. { text: "Реєстрація на домашні групи відкрита!", href: "/groups" } to show
