"use client";

import { useEffect, useRef, useState } from "react";

const hlsSrc = "/media/hero-hls-grade2/master.m3u8";
const fallbackSrc = "/media/hero-worship-loop.mp4?v=grade2";
const posterSrc = "/media/hero-worship-poster.jpg?v=grade2";
const posterSrcSet =
  "/media/hero-worship-poster-800.webp?v=grade2 800w, /media/hero-worship-poster-1200.webp?v=grade2 1200w, /media/hero-worship-poster-1440.webp?v=grade2 1440w, /media/hero-worship-poster.jpg?v=grade2 1920w";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const poster = posterRef.current;
    if (!video) return;
    let disposed = false;
    let hlsInstance: { destroy: () => void } | null = null;

    const play = () => {
      void video.play().catch(() => {
        /* Muted autoplay can still be deferred by browser power-saving modes. */
      });
    };
    const enableFallback = () => {
      if (disposed) return;
      video.src = fallbackSrc;
      video.load();
      play();
    };

    const initHls = () => {
      if (disposed) return;
      const useNativeHls =
        video.canPlayType("application/vnd.apple.mpegurl") !== "" &&
        navigator.vendor.includes("Apple");

      if (useNativeHls) {
        video.src = hlsSrc;
        video.load();
        play();
        return;
      }

      void import("hls.js/light")
        .then(({ default: Hls }) => {
          if (disposed) return;
          if (!Hls.isSupported()) {
            enableFallback();
            return;
          }
          const hls = new Hls({
            backBufferLength: 45,
            maxBufferLength: 45,
            maxMaxBufferLength: 45,
            maxBufferSize: 100_000_000,
            startFragPrefetch: true,
            capLevelToPlayerSize: false,
            startLevel: 0,
            abrEwmaDefaultEstimate: 1_500_000,
          });
          hlsInstance = hls;
          hls.loadSource(hlsSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const dpr = window.devicePixelRatio || 1;
            const maxWidth = video.clientWidth * dpr;
            let cap = 0;
            for (let i = hls.levels.length - 1; i >= 0; i--) {
              const level = hls.levels[i];
              if (level.width && level.width <= maxWidth) {
                cap = i;
                break;
              }
            }
            hls.autoLevelCapping = cap;
            play();
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            hls.destroy();
            hlsInstance = null;
            enableFallback();
          });
        })
        .catch(enableFallback);
    };

    if (poster) {
      if (poster.complete) {
        initHls();
      } else {
        const onLoad = () => {
          if (!disposed) initHls();
          poster.onload = null;
          poster.onerror = null;
        };
        const onError = () => {
          if (!disposed) initHls();
          poster.onload = null;
          poster.onerror = null;
        };
        poster.onload = onLoad;
        poster.onerror = onError;
      }
    } else {
      initHls();
    }

    return () => {
      disposed = true;
      hlsInstance?.destroy();
      if (poster) {
        poster.onload = null;
        poster.onerror = null;
      }
    };
  }, []);

  return (
    <div className={`hero-video-stage${playing ? " is-playing" : ""}`}>
      <img
        ref={posterRef}
        className="hero-video-poster"
        src={posterSrc}
        srcSet={posterSrcSet}
        sizes="100vw"
        alt=""
        width={1920}
        height={1080}
        fetchPriority="high"
        loading="eager"
        aria-hidden="true"
      />
      <video
        ref={videoRef}
        className="hero-video-element"
        data-stream-src={hlsSrc}
        data-fallback-src={fallbackSrc}
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
      />
    </div>
  );
}
