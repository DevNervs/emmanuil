import type { MetadataRoute } from "next";
import { news } from "./content";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/news", "/about", "/team", "/groups", "/online", "/contacts", "/donate", ...news.map((item) => `/news/${item.slug}`)];
  return routes.map((route) => ({ url: `https://emmanuil.pages.dev${route}`, lastModified: new Date(), changeFrequency: route === "/news" ? "weekly" : "monthly", priority: route === "" ? 1 : .8 }));
}
