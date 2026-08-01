"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MapPin, Users } from "lucide-react";
import type { Group as LegacyGroup } from "../data/groups";

type HomeGroup = {
  id: number;
  title: string;
  leaders: string;
  time: string;
  day?: string;
  address?: string;
  coordinates?: string;
};

const weekdayOrder = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];

function normalize(groups: LegacyGroup[]): HomeGroup[] {
  return groups.map((g, i) => ({
    id: i + 1,
    title: g.title,
    leaders: g.leaders,
    time: g.time,
    day: (g.time ?? "").split(",")[0].trim(),
    address: g.address,
    coordinates: g.coordinates,
  }));
}

export function HomeGroups({ propGroups }: { propGroups: LegacyGroup[] }) {
  const [apiGroups, setApiGroups] = useState<HomeGroup[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { groups: HomeGroup[] };
        const valid = data.groups
          ?.filter((g) => g != null)
          .map((g) => ({
            ...g,
            day: (g.day ?? (g.time ?? "").split(",")[0]).trim(),
          }));
        if (valid?.length) setApiGroups(valid);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const groups = useMemo(() => {
    const source = apiGroups ?? normalize(propGroups);
    return [...source].sort(
      (a, b) =>
        weekdayOrder.indexOf(a.day || "") - weekdayOrder.indexOf(b.day || "") ||
        a.title.localeCompare(b.title, "uk"),
    );
  }, [apiGroups, propGroups]);

  if (!loaded) {
    return (
      <section data-header-theme="light" className="home-now" aria-labelledby="home-groups-title">
        <div className="home-now-heading">
          <div>
            <p className="overline">Домашні групи</p>
            <h2 id="home-groups-title">Завантаження...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-header-theme="light" className="home-now" aria-labelledby="home-groups-title">
      <div className="home-now-heading">
        <div>
          <p className="overline">Домашні групи</p>
          <h2 id="home-groups-title">Актуальні групи цього сезону</h2>
        </div>
        <a className="button button-ghost" href="/groups/">Всі групи</a>
      </div>
      <p className="home-now-lead">
        Оберіть домашню групу за днем, часом та локацією. Лідер зв’яжеться з вами.
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Немає груп для показу.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <article
              key={g.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--wine)]">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {g.day || (g.time ?? "").split(",")[0].trim()}
                </span>
                <span className="text-xs text-[var(--muted)]">{g.time}</span>
              </div>
              <h3 className="font-[var(--serif)] text-base font-medium leading-tight text-[var(--ink)]">
                {g.title}
              </h3>
              <p className="text-sm text-[var(--muted)]">{g.leaders}</p>
              {g.address ? (
                <p className="flex items-start gap-1 text-sm text-[var(--ink)]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                  <span>{g.address}</span>
                </p>
              ) : (
                <p className="text-sm text-[var(--muted)]">Адресу уточнюйте у ведучого</p>
              )}
              <div className="mt-auto pt-2">
                <a
                  href={`/groups?register=1&group=${g.id}`}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--wine)] transition-colors hover:text-[var(--wine-dark)]"
                >
                  Записатися
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
