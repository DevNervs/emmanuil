"use client";

import { useSiteConfig } from "./SiteConfig";

export function HeroAnnouncement() {
  const { config } = useSiteConfig();
  const announcement = config.announcement;

  if (!announcement?.enabled || !announcement.text) return null;

  return (
    <section data-header-theme="dark" className="announcement-bar">
      {announcement.href ? (
        <a href={announcement.href}>{announcement.text}</a>
      ) : (
        <p>{announcement.text}</p>
      )}
    </section>
  );
}
