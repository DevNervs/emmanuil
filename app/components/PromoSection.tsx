"use client";

import { useSiteConfig } from "./SiteConfig";

export function PromoSection() {
  const { config } = useSiteConfig();
  const promo = config.promo;

  if (!promo?.enabled || !promo.videoUrl || !promo.title) return null;

  return (
    <section data-header-theme="light" className="promo-section border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-1 w-full">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-[var(--ink)] shadow-2xl">
              <video
                className="h-full w-full object-cover"
                src={promo.videoUrl}
                poster={promo.posterUrl || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
          </div>

          <div className="order-2 flex flex-col gap-5">
            <div className="h-1 w-20 bg-[var(--wine)]" />
            <h2 className="font-[var(--serif)] text-3xl font-semibold leading-tight text-[var(--ink)] md:text-4xl lg:text-5xl">
              {promo.title}
            </h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--muted)] md:text-lg">
              {promo.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
