import type { MetadataRoute } from "next";
import { news, site } from "./content";
export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = "2026-07-17";
  const routes = ["", "/visit", "/about", "/team", "/groups", "/online", "/contacts", "/donate", "/privacy", "/news"];
  return [
    ...routes.map((route) => ({ url: `${site.canonicalUrl}${route}`, lastModified: updatedAt, changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : route === "/visit" ? .9 : .8 })),
    ...news.map((item) => ({ url: `${site.canonicalUrl}/news/${item.slug}`, lastModified: item.publishedAt, changeFrequency: "yearly" as const, priority: .55 })),
  ];
}
