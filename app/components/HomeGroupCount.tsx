"use client";

import { useEffect, useState } from "react";

export function HomeGroupCount({ fallback }: { fallback: number }) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    fetch("/api/groups")
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { groups?: unknown[] };
        if (Array.isArray(data.groups)) setCount(data.groups.filter(Boolean).length);
      })
      .catch(() => {});
  }, []);

  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const noun =
    remainder10 === 1 && remainder100 !== 11
      ? "група"
      : remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)
        ? "групи"
        : "груп";

  return <>{count} {noun}</>;
}
