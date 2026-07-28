"use client";

import { useEffect, useRef, useState } from "react";

const hlsSrc = "/media/hero-hls-organic/playlist.m3u8";
const fallbackSrc = "/media/hero-worship-loop.mp4?v=organic-grain";
const posterSrc = "/media/hero-worship-poster.jpg?v=organic-grain";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let hlsInstance: { destroy: () => void } | null = null;

    const play = () => {
      void video.play().catch(() => {
        /* Muted autoplay can still be deferred by browser power-saving modes. */
      });
    };
    const useFallback = () => {
      if (disposed) return;
      video.src = fallbackSrc;
      video.load();
      play();
    };

    const useNativeHls =
      video.canPlayType("application/vnd.apple.mpegurl") !== "" &&
      navigator.vendor.includes("Apple");

    if (useNativeHls) {
      video.src = hlsSrc;
      video.load();
      play();
    } else {
      void import("hls.js/light").then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) {
          useFallback();
          return;
        }
        const hls = new Hls({
          backBufferLength: 4,
          maxBufferLength: 8,
          maxMaxBufferLength: 12,
          startFragPrefetch: true,
        });
        hlsInstance = hls;
        hls.loadSource(hlsSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, play);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          hls.destroy();
          hlsInstance = null;
          useFallback();
        });
      }).catch(useFallback);
    }

    return () => {
      disposed = true;
      hlsInstance?.destroy();
    };
  }, []);

  return (
    <div className={`hero-video-stage${playing ? " is-playing" : ""}`}>
      <div className="hero-video-poster" aria-hidden="true" />
      <video
        ref={videoRef}
        className="hero-video-element"
        data-stream-src={hlsSrc}
        data-fallback-src={fallbackSrc}
        poster={posterSrc}
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
