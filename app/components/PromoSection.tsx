"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSiteConfig } from "./SiteConfig";

export function PromoSection() {
  const { config } = useSiteConfig();
  const promo = config.promo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (!playing) {
      video.play().catch(() => {});
    }
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [promo?.videoUrl]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    setMuted(next);
    video.muted = next;
    if (!playing) video.play().catch(() => {});
  };

  if (!promo?.enabled || !promo.videoUrl || !promo.title) return null;

  return (
    <section data-header-theme="light" className="promo-section border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-1 w-full">
            <div className="group relative aspect-video overflow-hidden rounded-2xl bg-[var(--ink)] shadow-2xl">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={promo.videoUrl}
                poster={promo.posterUrl || undefined}
                autoPlay
                muted={muted}
                loop
                playsInline
                preload="auto"
                controls={false}
              />
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus:outline-none"
                aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
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
