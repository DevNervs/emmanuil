"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
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

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Try autoplay with sound. Most browsers block unmuted autoplay,
    // so fall back to muted autoplay so the video still starts.
    video.muted = false;
    video
      .play()
      .then(() => setMuted(false))
      .catch(() => {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [promo?.videoUrl]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!playing) {
      video.muted = false;
      setMuted(false);
      video.play().catch(() => {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    } else {
      const next = !muted;
      setMuted(next);
      video.muted = next;
    }
  };

  if (!promo?.enabled || !promo.videoUrl || !promo.title) return null;

  return (
    <section data-header-theme="light" className="promo-section overflow-hidden border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="grid h-[40vh] min-h-[18rem] grid-cols-1 grid-rows-1 lg:h-[45vh] lg:min-h-[22rem] lg:max-h-[540px] lg:grid-cols-2">
        <div className="relative h-full min-h-0 w-full bg-[var(--ink)]">
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
            onClick={toggleSound}
            className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 focus:outline-none"
            aria-label={playing ? (muted ? "Увімкнути звук" : "Вимкнути звук") : "Відтворити зі звуком"}
          >
            {!playing ? <Play className="h-5 w-5" /> : muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex h-full min-h-0 flex-col justify-start overflow-y-auto bg-[var(--paper)] p-6 lg:justify-center lg:p-10">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-4 py-2">
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
