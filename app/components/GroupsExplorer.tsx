"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Send, X } from "lucide-react";
import type { Group as LegacyGroup } from "../content";

type ApiGroup = { id: number; title: string; leaders: string; description: string; time: string; day?: string; address?: string; coordinates?: string; showOnHome?: boolean; };
type Group = ApiGroup;
type SubmitState = "idle" | "sending" | "sent" | "error";
const weekdayOrder = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];

export function GroupsExplorer({ groups: propGroups, launcherOnly = false }: { groups: LegacyGroup[]; launcherOnly?: boolean }) {
  const [query, setQuery] = useState("");
  const [day, setDay] = useState("Усі дні");
  const [selected, setSelected] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [chosenGroups, setChosenGroups] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [apiGroups, setApiGroups] = useState<Group[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);

  const fallbackGroups = useMemo<Group[]>(() => propGroups.map((group, index) => ({
    ...group,
    id: index + 1,
    description: "",
    day: (group.time ?? "").split(",")[0].trim(),
    showOnHome: true,
  } as Group)).filter((g) => g != null), [propGroups]);
  const groups = (apiGroups?.filter((g) => g != null) ?? []).length ? apiGroups!.filter((g) => g != null) : fallbackGroups;

  useEffect(() => {
    fetch("/api/groups")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json() as { groups: Group[]; season: unknown | null };
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

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const register = params.get("register") === "1";
    const groupIdParam = params.get("group");
    const url = new URL(window.location.href);
    let changed = false;

    if (groupIdParam) {
      const groupId = parseInt(groupIdParam, 10);
      if (Number.isFinite(groupId) && groupId > 0) {
        setSelected(Math.max(0, groupId - 1));
        setChosenGroups([groupId]);
        startedAt.current = Date.now();
        if (register) setFormOpen(true);
      }
    } else if (register) {
      openRegistration();
    }

    if (params.has("register")) {
      url.searchParams.delete("register");
      changed = true;
    }
    if (params.has("group")) {
      url.searchParams.delete("group");
      changed = true;
    }
    if (changed) {
      window.history.replaceState({}, "", url.toString());
    }
  }, [loaded]);

  const groupDays = useMemo(() => groups
    .filter((group) => group != null)
    .map((group) => (group.day ?? (group.time ?? "").split(",")[0]).trim())
    .filter(Boolean), [groups]);
  const days = useMemo(() => [
    ...Array.from(new Set(groupDays))
      .sort((first, second) => weekdayOrder.indexOf(first) - weekdayOrder.indexOf(second)),
    "Усі дні",
  ], [groupDays]);
  const filtered = useMemo(() => groups.filter((group) => {
    if (!group) return false;
    const groupDay = (group.day ?? (group.time ?? "").split(",")[0]).trim();
    const haystack = `${group.title ?? ""} ${group.leaders ?? ""} ${group.address ?? ""}`.toLocaleLowerCase("uk");
    return (day === "Усі дні" || groupDay === day) && haystack.includes(query.trim().toLocaleLowerCase("uk"));
  }), [groups, query, day]);
  const active = filtered[selected] ?? filtered[0];

  useEffect(() => {
    if (!formOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [formOpen]);

  function changeFilters(next?: string) { if (next !== undefined) setQuery(next); setSelected(0); }

  function openRegistration() {
    if (active) setChosenGroups([active.id]);
    startedAt.current = Date.now();
    setSubmitState("idle");
    setSubmitMessage("");
    setFormOpen(true);
  }

  function toggleGroup(id: number) {
    setChosenGroups((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 2 ? [...current, id] : current);
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosenGroups.length || chosenGroups.length > 2) {
      setSubmitState("error");
      setSubmitMessage("Оберіть одну або дві домашні групи.");
      return;
    }
    const data = new FormData(event.currentTarget);
    setSubmitState("sending");
    setSubmitMessage("");
    try {
      const response = await fetch("/api/group-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, phone, groups: chosenGroups, website: data.get("website"), startedAt: startedAt.current }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Не вдалося надіслати заявку.");
      setSubmitState("sent");
      setSubmitMessage(result.message || "Заявку надіслано. Адміністратор зв’яжеться з вами.");
      setName("");
      setPhone("");
      setChosenGroups([]);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Не вдалося надіслати заявку. Спробуйте ще раз.");
    }
  }

  return <section data-header-theme="light" className={launcherOnly ? "group-registration-launcher" : "groups-explorer"} id={launcherOnly ? undefined : "groups-map"}>
    {launcherOnly ? (
      <button className="button button-wine" type="button" onClick={openRegistration}>Записатися на групу</button>
    ) : <>
    <div className="groups-explorer-head"><div><p className="overline overline-light">Місця зустрічей</p><h2>Домашні групи</h2></div><p>Знайдіть групу за днем, назвою, ведучим або адресою та відкрийте точний маршрут.</p></div>
    <button className="groups-register-cta" type="button" onClick={openRegistration}>
      <span><b>Записатися на домашню групу</b><small>Оберіть одну або дві групи — адміністратор зв’яжеться з вами у Telegram</small></span>
      <i aria-hidden="true"><ArrowRight strokeWidth={1.8} /></i>
    </button>
    <div className="group-tools">
      <label><span>Пошук</span><input type="search" value={query} onChange={(event) => changeFilters(event.target.value)} placeholder="Назва, ведучий або адреса" /></label>
      <div className="day-filters" aria-label="Фільтр за днем">{days.map((item) => <button type="button" className={item === day ? "is-active" : ""} aria-pressed={item === day} onClick={() => { setDay(item); setSelected(0); }} key={item}>{item}</button>)}</div>
    </div>
    <div className="groups-explorer-layout">
      <div className="groups-results" aria-live="polite">
        {filtered.length ? filtered.map((group, index) => <button type="button" className={`group-result ${active === group ? "is-active" : ""}`} onClick={() => setSelected(index)} key={group.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{group.title}</strong><small>{group.leaders}</small><b>{group.time}</b><address>{group.address || "Адресу уточнюйте у ведучого"}</address></div></button>) : <p className="empty-result">За цими параметрами груп не знайдено.</p>}
      </div>
      <div className="group-map-card">
        {active?.coordinates ? <><div className="group-map-info"><div><span>Обрана група</span><strong>{active.title}</strong><small>{active.address || "Адресу уточнюйте у ведучого"}</small></div><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(active.coordinates)}`} target="_blank" rel="noreferrer">Прокласти маршрут ↗</a></div><iframe key={active.coordinates} src={`https://www.google.com/maps?q=${encodeURIComponent(active.coordinates)}&z=17&output=embed`} title={`${active.title} на карті`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></> : <div className="map-unavailable"><strong>{active?.title}</strong><p>Адресу цієї групи потрібно уточнити у ведучого.</p></div>}
      </div>
    </div>
    </>}

    {formOpen && typeof document !== "undefined" ? createPortal(
      <div className="group-form-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setFormOpen(false); }}>
        <div ref={dialog} className="group-form-dialog" role="dialog" aria-modal="true" aria-labelledby="group-form-title" tabIndex={-1}>
          <button className="group-form-close" type="button" onClick={() => setFormOpen(false)} aria-label="Закрити анкету"><X aria-hidden="true" /></button>
          <aside className="group-form-intro">
            <p className="overline overline-light">Домашні групи</p>
            <h2 id="group-form-title">Знайдіть<br />своїх людей</h2>
            <p>Заповніть коротку анкету. Після надсилання адміністратор зв’яжеться з вами та підтвердить участь.</p>
            <div><span>01</span><b>Ваші контакти</b></div><div><span>02</span><b>До двох груп</b></div><div><span>03</span><b>Підтвердження</b></div>
          </aside>
          {submitState === "sent" ? <div className="group-form-success"><span><Check aria-hidden="true" /></span><p className="overline">Заявку прийнято</p><h3>Дякуємо!</h3><p>{submitMessage}</p><button className="button button-wine" type="button" onClick={() => setFormOpen(false)}>Готово</button></div> :
          <form className="group-application-form" onSubmit={submitApplication}>
            <div className="group-form-heading"><span>Коротка анкета</span><strong>{chosenGroups.length}/2 групи</strong></div>
            <fieldset className="group-form-groups"><legend>Оберіть одну або дві групи *</legend><p>Одночасно можна записатися максимум у дві домашні групи.</p><div>{groups.map((group, index) => {
              const checked = chosenGroups.includes(group.id);
              const disabled = !checked && chosenGroups.length >= 2;
              return <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} className={checked ? "is-selected" : disabled ? "is-disabled" : ""} onClick={() => toggleGroup(group.id)} key={group.id}><span><i>{String(index + 1).padStart(2, "0")}</i><b>{group.title}</b><small>{group.leaders} · {group.time}</small><em>{group.address || "Адресу уточнюйте у ведучого"}</em></span><Check aria-hidden="true" /></button>;
            })}</div></fieldset>
            <div className="group-form-contact-fields">
              <label className="group-form-field"><span>Прізвище та ім’я *</span><input value={name} onChange={(event) => setName(event.target.value)} name="name" autoComplete="name" minLength={2} maxLength={100} placeholder="Наприклад, Анна Коваль" required /></label>
              <label className="group-form-field"><span>Номер телефону *</span><input value={phone} onChange={(event) => setPhone(event.target.value)} name="phone" type="tel" autoComplete="tel" minLength={9} maxLength={20} placeholder="066 950 99 77" required /><small>Вкажіть номер, за яким адміністратор зможе з вами зв’язатися.</small></label>
            </div>
            <label className="group-form-consent"><input type="checkbox" required /><span>Погоджуюсь, щоб адміністратор церкви зв’язався зі мною щодо участі у групі, та приймаю <a href="/privacy" target="_blank" rel="noreferrer">політику конфіденційності</a>.</span></label>
            <label className="group-form-honeypot" aria-hidden="true">Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" /></label>
            {submitMessage ? <p className={`group-submit-message ${submitState}`}>{submitMessage}</p> : null}
            <button className="group-submit-button" type="submit" disabled={submitState === "sending" || !chosenGroups.length}><span>{submitState === "sending" ? "Надсилаємо…" : "Надіслати заявку"}</span><Send aria-hidden="true" /></button>
          </form>}
        </div>
      </div>,
      document.body,
    ) : null}
  </section>;
}
