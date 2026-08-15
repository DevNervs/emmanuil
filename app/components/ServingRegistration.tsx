"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Send, X } from "lucide-react";
import type { ServingInfo } from "../data/servings";

type SubmitState = "idle" | "sending" | "sent" | "error";

function timestamp(): number {
  return Date.now();
}

export function ServingRegistration({ servings: propServings }: { servings: ServingInfo[] }) {
  const [apiServings, setApiServings] = useState<ServingInfo[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);

  const servings = useMemo(() => (apiServings?.length ? apiServings : propServings), [apiServings, propServings]);

  useEffect(() => {
    fetch("/api/servings")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json() as { servings?: ServingInfo[] };
        if (data.servings?.length) setApiServings(data.servings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [formOpen]);

  function openForm(servingId?: number) {
    setChosen(servingId ?? null);
    startedAt.current = timestamp();
    setSubmitState("idle");
    setSubmitMessage("");
    setFormOpen(true);
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (chosen == null) {
      setSubmitState("error");
      setSubmitMessage("Оберіть служіння зі списку.");
      return;
    }
    const data = new FormData(event.currentTarget);
    setSubmitState("sending");
    setSubmitMessage("");
    try {
      const response = await fetch("/api/serving-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, phone, serving: chosen, message: note, website: data.get("website"), startedAt: startedAt.current }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Не вдалося надіслати заявку.");
      setSubmitState("sent");
      setSubmitMessage(result.message || "Заявку надіслано. Адміністратор зв’яжеться з вами.");
      setName("");
      setPhone("");
      setNote("");
      setChosen(null);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Не вдалося надіслати заявку. Спробуйте ще раз.");
    }
  }

  return <section data-header-theme="light" className="serving-section" id="serving-list" aria-labelledby="serving-title">
    <div className="serving-head">
      <div><p className="overline">Напрямки служінь</p><h2 id="serving-title">Служіння церкви</h2></div>
      <p>Оберіть напрямок, у якому хочете служити, заповніть коротку анкету — відповідальний служитель зв’яжеться з вами.</p>
    </div>
    <div className="serving-grid">
      {servings.map((serving) => <article className="serving-card" key={serving.id}>
        <h3>{serving.title}</h3>
        <p>{serving.description}</p>
        <button className="button button-wine" type="button" onClick={() => openForm(serving.id)}>Записатися</button>
      </article>)}
    </div>

    {formOpen && typeof document !== "undefined" ? createPortal(
      <div className="group-form-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setFormOpen(false); }}>
        <div ref={dialog} className="group-form-dialog" role="dialog" aria-modal="true" aria-labelledby="serving-form-title" tabIndex={-1}>
          <button className="group-form-close" type="button" onClick={() => setFormOpen(false)} aria-label="Закрити анкету"><X aria-hidden="true" /></button>
          <aside className="group-form-intro">
            <p className="overline overline-light">Служіння</p>
            <h2>Служіть<br />своїм даром</h2>
            <p>Заповніть коротку анкету. Після надсилання відповідальний служитель зв’яжеться з вами та розповість про наступні кроки.</p>
            <div><span>01</span><b>Оберіть напрямок</b></div><div><span>02</span><b>Ваші контакти</b></div><div><span>03</span><b>Зустріч із відповідальним</b></div>
          </aside>
          {submitState === "sent" ? <div className="group-form-success"><span><Check aria-hidden="true" /></span><p className="overline">Заявку прийнято</p><h3>Дякуємо!</h3><p>{submitMessage}</p><button className="button button-wine" type="button" onClick={() => setFormOpen(false)}>Готово</button></div> :
          <form className="group-application-form" onSubmit={submitApplication}>
            <div className="group-form-heading"><span>Коротка анкета</span><strong>{chosen != null ? "1/1 служіння" : "оберіть служіння"}</strong></div>
            <fieldset className="group-form-groups"><legend>Оберіть служіння *</legend><p>Якщо хочете служити в кількох напрямках, надішліть анкету для кожного окремо.</p><div>{servings.map((serving, index) => {
              const checked = chosen === serving.id;
              return <button type="button" role="checkbox" aria-checked={checked} className={checked ? "is-selected" : ""} onClick={() => setChosen(serving.id)} key={serving.id}><span><i>{String(index + 1).padStart(2, "0")}</i><b>{serving.title}</b><em>{serving.description}</em></span><Check aria-hidden="true" /></button>;
            })}</div></fieldset>
            <div className="group-form-contact-fields">
              <label className="group-form-field"><span>Прізвище та ім’я *</span><input value={name} onChange={(event) => setName(event.target.value)} name="name" autoComplete="name" minLength={2} maxLength={100} placeholder="Наприклад, Анна Коваль" required /></label>
              <label className="group-form-field"><span>Номер телефону *</span><input value={phone} onChange={(event) => setPhone(event.target.value)} name="phone" type="tel" autoComplete="tel" minLength={9} maxLength={20} placeholder="066 950 99 77" required /><small>Вкажіть номер, за яким відповідальний служитель зможе з вами зв’язатися.</small></label>
              <label className="group-form-field"><span>Коментар</span><textarea value={note} onChange={(event) => setNote(event.target.value)} name="message" rows={3} maxLength={1000} placeholder="Досвід, запитання або побажання щодо служіння" className="group-form-note" /></label>
            </div>
            <label className="group-form-consent"><input type="checkbox" required /><span>Погоджуюсь, щоб відповідальний служитель церкви зв’язався зі мною щодо участі у служінні, та приймаю <a href="/privacy" target="_blank" rel="noreferrer">політику конфіденційності</a>.</span></label>
            <label className="group-form-honeypot" aria-hidden="true">Ваш сайт<input name="website" tabIndex={-1} autoComplete="off" /></label>
            {submitMessage ? <p className={`group-submit-message ${submitState}`}>{submitMessage}</p> : null}
            <button className="group-submit-button" type="submit" disabled={submitState === "sending" || chosen == null}><span>{submitState === "sending" ? "Надсилаємо…" : "Надіслати заявку"}</span><Send aria-hidden="true" /></button>
          </form>}
        </div>
      </div>,
      document.body,
    ) : null}
  </section>;
}
