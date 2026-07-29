"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSiteConfig } from "./SiteConfig";

export function PromoSection() {
  const { config } = useSiteConfig();
  const promo = config.promo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Start muted so autoplay reliably works in every browser.
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
    if (!video.paused && !next) {
      // already playing; just unmute
      return;
    }
    if (video.paused) {
      video.play().catch(() => {});
    }
  };

  if (!promo?.enabled || !promo.videoUrl || !promo.title) return null;

  return (
    <section data-header-theme="light" className="promo-section overflow-hidden border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="grid h-[80vh] min-h-[28rem] grid-cols-[auto_1fr] lg:h-[90vh] lg:min-h-[36rem]">
        <div className="relative flex h-full min-h-0 items-center justify-center bg-black">
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

        <div className="flex h-full min-h-0 flex-col justify-center overflow-y-auto bg-[var(--paper)] p-6 lg:p-10">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
            <div className="h-1 w-20 bg-[var(--wine)]" />
            <h2 className="font-[var(--serif)] text-2xl font-semibold leading-tight text-[var(--ink)] md:text-3xl">
              {promo.title}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)] md:text-base">
              {promo.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
