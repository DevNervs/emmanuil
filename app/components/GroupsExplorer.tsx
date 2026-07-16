"use client";

import { useMemo, useState } from "react";

type Group = { title: string; leaders: string; time: string; address: string; coordinates?: string };

export function GroupsExplorer({ groups }: { groups: Group[] }) {
  const [query, setQuery] = useState("");
  const [day, setDay] = useState("Усі дні");
  const [selected, setSelected] = useState(0);
  const days = ["Усі дні", ...Array.from(new Set(groups.map((group) => group.time.split(",")[0]).filter(Boolean)))];
  const filtered = useMemo(() => groups.filter((group) => {
    const haystack = `${group.title} ${group.leaders} ${group.address}`.toLocaleLowerCase("uk");
    return (day === "Усі дні" || group.time.startsWith(day)) && haystack.includes(query.trim().toLocaleLowerCase("uk"));
  }), [groups, query, day]);
  const active = filtered[selected] ?? filtered[0];

  function changeFilters(next?: string) { if (next !== undefined) setQuery(next); setSelected(0); }

  return <section className="groups-explorer" id="groups-map">
    <div className="groups-explorer-head"><div><p className="overline overline-light">Місця зустрічей</p><h2>Домашні групи</h2></div><p>Знайдіть групу за днем, назвою, ведучим або адресою та відкрийте точний маршрут.</p></div>
    <div className="group-tools">
      <label><span>Пошук</span><input type="search" value={query} onChange={(event) => changeFilters(event.target.value)} placeholder="Назва, ведучий або адреса" /></label>
      <div className="day-filters" aria-label="Фільтр за днем">{days.map((item) => <button type="button" className={item === day ? "is-active" : ""} aria-pressed={item === day} onClick={() => { setDay(item); setSelected(0); }} key={item}>{item}</button>)}</div>
    </div>
    <div className="groups-explorer-layout">
      <div className="groups-results" aria-live="polite">
        {filtered.length ? filtered.map((group, index) => <button type="button" className={`group-result ${active === group ? "is-active" : ""}`} onClick={() => setSelected(index)} key={`${group.title}-${group.address}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{group.title}</strong><small>{group.leaders}</small><b>{group.time}</b><address>{group.address || "Адресу уточнюйте у ведучого"}</address></div></button>) : <p className="empty-result">За цими параметрами груп не знайдено.</p>}
      </div>
      <div className="group-map-card">
        {active?.coordinates ? <><div className="group-map-info"><div><span>Обрана група</span><strong>{active.title}</strong><small>{active.address}</small></div><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(active.coordinates)}`} target="_blank" rel="noreferrer">Прокласти маршрут ↗</a></div><iframe key={active.coordinates} src={`https://www.google.com/maps?q=${encodeURIComponent(active.coordinates)}&z=17&output=embed`} title={`${active.title} на карті`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></> : <div className="map-unavailable"><strong>{active?.title}</strong><p>Адресу цієї групи потрібно уточнити у ведучого.</p></div>}
      </div>
    </div>
  </section>;
}
