"use client";

import { useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa";

type LiveState = { status: "checking" | "live" | "offline" | "unavailable"; videoId?: string };

export function LiveStream() {
  const [state, setState] = useState<LiveState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    const checkLive = async () => {
      try {
        const response = await fetch("/api/youtube-live", { cache: "no-store" });
        const result = await response.json() as { live?: boolean; videoId?: string; available?: boolean };
        if (!active) return;
        setState(result.live && result.videoId
          ? { status: "live", videoId: result.videoId }
          : result.available === false || !response.ok
            ? { status: "unavailable" }
            : { status: "offline" });
      } catch {
        if (active) setState({ status: "unavailable" });
      }
    };

    checkLive();
    const interval = window.setInterval(checkLive, 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  if (state.status === "live" && state.videoId) {
    return <div className="video-frame is-live">
      <span className="live-indicator"><i aria-hidden="true" /> Наживо</span>
      <iframe src={`https://www.youtube.com/embed/${state.videoId}?rel=0`} title="Онлайн-трансляція церкви Еммануїл" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
    </div>;
  }

  const copy = state.status === "checking"
    ? { status: "Підключаємо трансляцію", title: "Перевіряємо ефір", text: "Зазвичай це займає лише кілька секунд." }
    : state.status === "unavailable"
      ? { status: "Статус не підтверджено", title: "Ефір може вже тривати", text: "Не вдалося оновити статус автоматично. Перевірте YouTube-канал церкви." }
      : { status: "Зараз офлайн", title: "Трансляція зараз не йде", text: "Щонеділі о 10:00 та 17:00 плеєр зʼявиться тут автоматично. Або дивіться записи на YouTube-каналі." };

  return <div className={`video-frame video-placeholder ${state.status === "checking" ? "is-checking" : ""}`} aria-live="polite">
    <span className="video-placeholder-status"><i aria-hidden="true" />{copy.status}</span>
    <h2>{copy.title}</h2>
    <p>{copy.text}</p>
    <a className="button button-light" href="https://www.youtube.com/@EmmanuilCV" target="_blank" rel="noreferrer"><FaYoutube aria-hidden="true" /> Перейти на YouTube-канал</a>
  </div>;
}
