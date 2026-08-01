"use client";

import { useLiveStatus, type LiveState } from "./useLiveStatus";

export function LiveOnlineButton({ initialState }: { initialState?: LiveState }) {
  const state = useLiveStatus(initialState);

  if (state.status === "live" && state.videoId) {
    return (
      <a className="button button-ghost is-live" href="/online/">
        <span className="live-dot" aria-hidden="true" />
        <span className="live-badge">Ефір</span>
        <span>Дивитися онлайн</span>
      </a>
    );
  }

  return null;
}
