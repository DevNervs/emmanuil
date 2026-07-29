"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, MapPin, Users, Volume2, VolumeX } from "lucide-react";
import { useSiteConfig } from "./SiteConfig";

export function PromoSection() {
  const { config } = useSiteConfig();
  const promo = config.promo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    setMuted(true);
    video.play().catch(() => {});
  }, [promo?.videoUrl]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    setMuted(next);
    video.muted = next;
    if (!video.paused && !next) return;
    if (video.paused) video.play().catch(() => {});
  };

  if (!promo?.enabled || !promo.videoUrl || !promo.title) return null;

  return (
    <section data-header-theme="light" className="promo-section overflow-hidden border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="grid h-[80vh] min-h-[28rem] grid-cols-1 lg:grid-cols-[auto_1fr] lg:h-[90vh] lg:min-h-[36rem]">
        <div className="relative flex h-[50vh] min-h-[20rem] items-center justify-center bg-black lg:h-full lg:min-h-0">
          <video
            ref={videoRef}
            className="h-full max-h-full w-auto max-w-full object-contain"
            src={promo.videoUrl}
            poster={promo.posterUrl || undefined}
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="auto"
          />
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-white backdrop-blur-sm transition-colors hover:bg-black/90 focus:outline-none"
            aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="text-xs font-medium">{muted ? "Увімкнути звук" : "Вимкнути звук"}</span>
          </button>
        </div>

        <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto bg-[var(--paper)] p-6 lg:justify-start lg:p-10">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <p className="overline">Анонс</p>
            <h2 className="font-[var(--serif)] text-3xl font-semibold leading-tight text-[var(--ink)] md:text-4xl">
              {promo.title}
            </h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--muted)] md:text-lg">
              {promo.description}
            </p>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--wine)]">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="uppercase tracking-wide">Дати</span>
                </div>
                <p className="text-sm text-[var(--ink)]">27.07 - 02.08</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--wine)]">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="uppercase tracking-wide">Місце</span>
                </div>
                <p className="text-sm text-[var(--ink)]">с.Заріччя, база «Золота генерація»</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--wine)]">
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="uppercase tracking-wide">Вік</span>
                </div>
                <p className="text-sm text-[var(--ink)]">9 - 15 років</p>
              </div>
            </div>

            <a
              href="https://www.instagram.com/p/DYmrIdmop8z/"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-wine w-fit"
            >
              <span>Детальніше</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
