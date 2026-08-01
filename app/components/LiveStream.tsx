"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FaYoutube } from "react-icons/fa";
import { useLiveStatus, type LiveState } from "./useLiveStatus";

const playerVars: Record<string, number | string> = {
  rel: 0,
  autoplay: 1,
  mute: 0,
  controls: 1,
  fs: 1,
  playsinline: 1,
  modestbranding: 0,
  enablejsapi: 1,
};

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();

    if (document.getElementById("youtube-iframe-api")) {
      const check = () => {
        if (window.YT?.Player) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
      return;
    }

    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.body.appendChild(tag);
  });
}

export function LiveStream({ initialState }: { initialState?: LiveState }) {
  const state = useLiveStatus(initialState);
  const playerId = `yt-player-${useId().replace(/[^a-zA-Z0-9]/g, "-")}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBehind, setIsBehind] = useState(false);

  useEffect(() => {
    if (state.status !== "live" || !state.videoId) return;
    const videoId = state.videoId;

    const localVars = {
      ...playerVars,
      origin: typeof window !== "undefined" ? window.location.origin : "",
    };

    let active = true;
    let interval = 0;

    const init = async () => {
      await loadYouTubeApi();
      if (!active || !window.YT?.Player) return;

      const player = new window.YT.Player(playerId, {
        videoId,
        playerVars: localVars,
        events: {
          onReady: () => {
            if (!active) return;
            playerRef.current = player;
            setIsReady(true);
            try { player.unMute(); } catch {}
          },
          onStateChange: () => {
            checkBehind();
          },
        },
      });
    };

    const checkBehind = () => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;
      try {
        const duration = player.getDuration();
        const current = player.getCurrentTime();
        // На прямых трансляциях duration — это текущее “живое” время.
        // Если отстаём более чем на 10 секунд, показываем кнопку.
        setIsBehind(duration > 0 && duration - current > 10);
      } catch {
        setIsBehind(false);
      }
    };

    void init();

    interval = window.setInterval(() => {
      checkBehind();
    }, 2_000);

    return () => {
      active = false;
      window.clearInterval(interval);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      setIsReady(false);
      setIsBehind(false);
    };
  }, [state.status, state.videoId, playerId]);

  const jumpToLive = () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const current = player.getCurrentTime();
      // Смещаемся далеко вперёд; YouTube сам ограничит до текущего live.
      player.seekTo(current + 6_000_000, true);
      player.playVideo();
      setIsBehind(false);
    } catch {}
  };

  if (state.status === "live" && state.videoId) {
    return (
      <div className="video-frame is-live" data-header-theme="dark">
        <div id={playerId} className="youtube-player" />
        {isReady && isBehind && (
          <button
            type="button"
            className="live-jump-button"
            onClick={jumpToLive}
            aria-label="Перейти до прямого ефіру"
          >
            <span className="live-dot" aria-hidden="true" />
            Прямий ефір
          </button>
        )}
      </div>
    );
  }

  const copy =
    state.status === "checking"
      ? { status: "Підключаємо трансляцію", title: "Перевіряємо ефір", text: "Зазвичай це займає лише кілька секунд." }
      : state.status === "unavailable"
        ? { status: "Статус не підтверджено", title: "Ефір може вже тривати", text: "Не вдалося оновити статус автоматично. Перевірте YouTube-канал церкви." }
        : { status: "Зараз офлайн", title: "Трансляція зараз не йде", text: "Щонеділі о 10:00 та 17:00 плеєр зʼявиться тут автоматично. Або дивіться записи на YouTube-каналі." };

  return (
    <div
      className={`video-frame video-placeholder ${state.status === "checking" ? "is-checking" : ""}`}
      aria-live="polite"
      data-header-theme="dark"
    >
      <span className="video-placeholder-status"><i aria-hidden="true" />{copy.status}</span>
      <h2>{copy.title}</h2>
      <p>{copy.text}</p>
      <a className="button button-light" href="https://www.youtube.com/@EmmanuilCV" target="_blank" rel="noopener noreferrer">
        <FaYoutube aria-hidden="true" /> Перейти на YouTube-канал
      </a>
    </div>
  );
}
