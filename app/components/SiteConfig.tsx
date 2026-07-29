"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { serviceLocations as defaultServiceLocations, team as defaultTeam, announcement as defaultAnnouncement } from "../content";
import type { ServiceLocation } from "../data/locations";

export type HeroConfig = {
  hlsUrl?: string;
  fallbackUrl?: string;
  posterUrl?: string;
  posterSrcSet?: string;
};

export type Announcement = {
  text: string;
  href?: string;
  enabled: boolean;
};

export type PromoConfig = {
  enabled: boolean;
  videoUrl: string;
  posterUrl?: string;
  title: string;
  description: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  image: string;
  facebook?: string;
  instagram?: string;
};

export type SiteConfig = {
  hero?: HeroConfig;
  announcement?: Announcement | null;
  promo?: PromoConfig;
  serviceLocations?: ServiceLocation[];
  team?: TeamMember[];
};

const defaultPosterSrcSet =
  "/media/hero-worship-poster-800.webp?v=grade3 800w, /media/hero-worship-poster-1200.webp?v=grade3 1200w, /media/hero-worship-poster-1440.webp?v=grade3 1440w, /media/hero-worship-poster.jpg?v=grade3 1920w";

export const defaultConfig: Required<SiteConfig> = {
  hero: {
    hlsUrl: "/media/hero-hls-grade3/master.m3u8",
    fallbackUrl: "/media/hero-worship-loop.mp4?v=grade3",
    posterUrl: "/media/hero-worship-poster.jpg?v=grade3",
    posterSrcSet: defaultPosterSrcSet,
  },
  announcement: defaultAnnouncement,
  promo: {
    enabled: true,
    videoUrl: "/media/promo-camp.mp4",
    posterUrl: "",
    title: "Літній табір em_kids_camp",
    description:
      "Запрошуємо дітей та підлітків 9-15 років на незабутній літній табір em_kids_camp.\n\nЧекає класний час разом з іграми, пригодами, новими друзями, творчими активностями, біблійними темами, молитвою та прославленням.\n\nУ програмі:\n• насичена програма;\n• ігри, квести та командні завдання;\n• творчі активності;\n• нові знайомства та друзі;\n• біблійні теми;\n• молитва та прославлення;\n• багато радості, сміху й незабутніх моментів.\n\nЧекаємо саме на тебе!",
  },
  serviceLocations: defaultServiceLocations,
  team: defaultTeam as TeamMember[],
};

const SiteConfigContext = createContext<{
  config: Required<SiteConfig>;
  loaded: boolean;
}>({
  config: defaultConfig,
  loaded: false,
});

export const useSiteConfig = () => useContext(SiteConfigContext);

function mergeConfig(api: SiteConfig): Required<SiteConfig> {
  return {
    hero: { ...defaultConfig.hero, ...(api.hero || {}) },
    announcement:
      api.announcement !== undefined ? api.announcement : defaultConfig.announcement,
    promo: api.promo ? { ...defaultConfig.promo, ...api.promo } : defaultConfig.promo,
    serviceLocations:
      api.serviceLocations?.length ? api.serviceLocations : defaultConfig.serviceLocations,
    team: api.team?.length ? api.team : defaultConfig.team,
  };
}

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Required<SiteConfig>>(defaultConfig);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/site")
      .then(async (res) => {
        if (!res.ok) return;
        const api = (await res.json()) as SiteConfig;
        setConfig(mergeConfig(api));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, loaded }}>
      {children}
    </SiteConfigContext.Provider>
  );
}
