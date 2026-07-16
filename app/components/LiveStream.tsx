"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { FaYoutube } from "react-icons/fa";

type LiveState = { status: "checking" | "live" | "offline"; videoId?: string };

export function LiveStream() {
  const [state, setState] = useState<LiveState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    const checkLive = async () => {
      try {
        const response = await fetch("/api/youtube-live", { cache: "no-store" });
        const result = await response.json() as { live?: boolean; videoId?: string };
        if (!active) return;
        setState(result.live && result.videoId ? { status: "live", videoId: result.videoId } : { status: "offline" });
      } catch {
        if (active) setState({ status: "offline" });
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

  return <div className={`video-frame video-placeholder ${state.status === "checking" ? "is-checking" : ""}`} aria-live="polite">
    <div className="video-placeholder-mark" aria-hidden="true">{state.status === "checking" ? <Radio /> : <FaYoutube />}</div>
    <span>{state.status === "checking" ? "Перевіряємо ефір…" : "Зараз немає трансляції"}</span>
    <h2>{state.status === "checking" ? "Одну мить" : "Ефір ще не розпочався"}</h2>
    <p>{state.status === "checking" ? "Перевіряємо канал церкви Еммануїл." : "Щойно трансляція розпочнеться на YouTube, відео автоматично з’явиться тут."}</p>
    <a className="button button-light" href="https://www.youtube.com/@EmmanuilCV" target="_blank" rel="noreferrer"><FaYoutube aria-hidden="true" /> Відкрити YouTube</a>
  </div>;
}
