"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export function CopyButton({ value, label = "Копіювати" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <button className="copy-button" type="button" onClick={copy} aria-live="polite">{copied ? "Скопійовано" : label}</button>;
}

export function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${email}`, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
      if (!response.ok) throw new Error("send failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <input className="honeypot" type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <input type="hidden" name="_subject" value="Повідомлення з сайту Еммануїл" />
    <div><label htmlFor="contact-name">ПІБ</label><input id="contact-name" name="name" autoComplete="name" required /></div>
    <div><label htmlFor="contact-email">E-mail</label><input id="contact-email" name="email" type="email" autoComplete="email" required /></div>
    <div><label htmlFor="contact-message">Повідомлення</label><textarea id="contact-message" name="message" rows={6} required /></div>
    <label className="form-consent"><input type="checkbox" name="privacy-consent" required /><span>Погоджуюсь з <a href="/privacy" target="_blank" rel="noreferrer">політикою конфіденційності</a> та обробкою даних для відповіді на звернення.</span></label>
    <button className="button button-wine" type="submit" disabled={status === "sending"}>{status === "sending" ? "Надсилаємо…" : "Надіслати"}</button>
    <p className={`form-status ${status}`} role="status" aria-live="polite">{status === "sent" ? "Дякуємо! Повідомлення надіслано." : status === "error" ? "Не вдалося надіслати. Спробуйте ще раз або напишіть нам на e-mail." : "Відповімо на вказану електронну адресу."}</p>
  </form>;
}
