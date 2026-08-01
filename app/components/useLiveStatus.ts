"use client";

import { useEffect, useState } from "react";

export type LiveState = { status: "checking" | "live" | "offline" | "unavailable"; videoId?: string };

const POLL_INTERVAL_MS = 60_000;

export function useLiveStatus(initialState?: LiveState): LiveState {
  const [state, setState] = useState<LiveState>(initialState ?? { status: "checking" });

  useEffect(() => {
    let active = true;
    let interval = 0;

    const check = async () => {
      try {
        const response = await fetch("/api/youtube-live", { cache: "no-store" });
        const result = (await response.json()) as {
          live?: boolean;
          videoId?: string;
          available?: boolean;
        };
        if (!active) return;
        setState(
          result.live && result.videoId
            ? { status: "live", videoId: result.videoId }
            : result.available === false || !response.ok
              ? { status: "unavailable" }
              : { status: "offline" }
        );
      } catch {
        if (active) setState({ status: "unavailable" });
      }
    };

    const start = () => {
      void check();
      interval = window.setInterval(check, POLL_INTERVAL_MS);
    };

    const onVisibility = () => {
      if (!document.hidden) void check();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}
