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
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const sender = String(data.get("email") || "");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(`Повідомлення з сайту — ${name}`);
    const body = encodeURIComponent(`ПІБ: ${name}\nE-mail: ${sender}\n\n${message}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return <form className="contact-form" onSubmit={submit}>
    <div><label htmlFor="contact-name">ПІБ</label><input id="contact-name" name="name" autoComplete="name" required /></div>
    <div><label htmlFor="contact-email">E-mail</label><input id="contact-email" name="email" type="email" autoComplete="email" required /></div>
    <div><label htmlFor="contact-message">Повідомлення</label><textarea id="contact-message" name="message" rows={6} required /></div>
    <button className="button button-wine" type="submit">Надіслати</button>
    <p>Після натискання відкриється ваша поштова програма.</p>
  </form>;
}
