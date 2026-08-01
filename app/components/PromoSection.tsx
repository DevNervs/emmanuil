"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useSiteConfig } from "./SiteConfig";

export function PromoSection() {
  const { config } = useSiteConfig();
  const promo = config.promo;
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const ambient = ambientVideoRef.current;
    if (!video || !ambient) return;

    let rafId = 0;
    let bothReady = false;

    const syncAmbient = () => {
      if (!bothReady || video.paused || video.ended) {
        ambient.pause();
        return;
      }
      if (Math.abs(ambient.currentTime - video.currentTime) > 0.2) {
        ambient.currentTime = video.currentTime;
      }
      ambient.playbackRate = video.playbackRate;
      if (ambient.paused) {
        ambient.play().catch(() => {});
      }
    };

    const loop = () => {
      syncAmbient();
      rafId = requestAnimationFrame(loop);
    };

    const tryPlay = () => {
      if (bothReady) {
        video.play().catch(() => {});
        ambient.play().catch(() => {});
      }
    };

    const onMainReady = () => {
      if (ambient.readyState >= 3) {
        bothReady = true;
        setIsReady(true);
        tryPlay();
      }
    };

    const onAmbientReady = () => {
      if (video.readyState >= 3) {
        bothReady = true;
        setIsReady(true);
        tryPlay();
      }
    };

    video.muted = true;
    ambient.muted = true;
    setMuted(true);

    video.addEventListener("canplaythrough", onMainReady);
    ambient.addEventListener("canplaythrough", onAmbientReady);
    video.addEventListener("error", onMainReady);
    ambient.addEventListener("error", onAmbientReady);

    // Start the sync loop immediately so it picks up playback as soon as it begins.
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("canplaythrough", onMainReady);
      ambient.removeEventListener("canplaythrough", onAmbientReady);
      video.removeEventListener("error", onMainReady);
      ambient.removeEventListener("error", onAmbientReady);
    };
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

  const paragraphs = (promo.description || "")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section data-header-theme="light" className="promo-section overflow-hidden border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,.92fr)]">
        <div className="relative isolate m-4 aspect-[4/3] overflow-hidden rounded-3xl bg-[#090b0f] sm:m-6">
          <video
            ref={ambientVideoRef}
            key={`ambient-${promo.videoUrl}`}
            className="promo-ambient-video pointer-events-none absolute inset-[-12%] h-[124%] w-[124%] scale-110 object-cover opacity-75 blur-[38px] saturate-[1.55] brightness-[.72]"
            src={promo.videoUrl}
            muted
            loop
            playsInline
            preload="auto"
            autoPlay
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_35%,rgba(4,6,10,.26)_100%)]"
            aria-hidden="true"
          />
          <video
            ref={videoRef}
            key={`main-${promo.videoUrl}`}
            className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_18px_42px_rgba(0,0,0,.38)]"
            src={promo.videoUrl}
            muted={muted}
            loop
            playsInline
            preload="auto"
            autoPlay
          />
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="text-xs font-medium">{muted ? "Увімкнути звук" : "Вимкнути звук"}</span>
          </button>
        </div>

        <div className="flex flex-col justify-center bg-[var(--paper)] px-6 py-10 sm:px-10 lg:px-12 lg:py-8 xl:px-16">
          <div className="flex w-full max-w-xl flex-col gap-5">
            <h2 className="font-[var(--serif)] text-[clamp(2rem,3.2vw,3.35rem)] font-semibold leading-[1.06] tracking-tight text-[var(--ink)]">
              {promo.title}
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-[var(--muted)] md:text-lg">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className="m-0 p-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
