"use client";

import { useRef, useState } from "react";
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

function timestamp(): number {
  return Date.now();
}

export function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("Не вдалося надіслати. Спробуйте ще раз або напишіть нам на e-mail.");
  const startedAt = useRef(timestamp());

  async function submitViaFormSubmit(form: HTMLFormElement): Promise<boolean> {
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${email}`, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      website: data.get("website"),
      startedAt: startedAt.current,
    };
    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        form.reset();
        setStatus("sent");
        return;
      }
      if (response.status < 500) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        setStatus("error");
        setErrorMessage(result?.message || "Не вдалося надіслати. Перевірте дані та спробуйте ще раз.");
        return;
      }
      throw new Error("server error");
    } catch {
      if (await submitViaFormSubmit(form)) {
        form.reset();
        setStatus("sent");
      } else {
        setStatus("error");
      }
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <input className="honeypot" type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <input className="honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <input type="hidden" name="_subject" value="Повідомлення з сайту Еммануїл" />
    <div><label htmlFor="contact-name">ПІБ</label><input id="contact-name" name="name" autoComplete="name" required /></div>
    <div><label htmlFor="contact-email">E-mail</label><input id="contact-email" name="email" type="email" autoComplete="email" required /></div>
    <div><label htmlFor="contact-message">Повідомлення</label><textarea id="contact-message" name="message" rows={6} required /></div>
    <label className="form-consent"><input type="checkbox" name="privacy-consent" required /><span>Погоджуюсь з <a href="/privacy" target="_blank" rel="noreferrer">політикою конфіденційності</a> та обробкою даних для відповіді на звернення.</span></label>
    <button className="button button-wine" type="submit" disabled={status === "sending"}>{status === "sending" ? "Надсилаємо…" : "Надіслати"}</button>
    <p className={`form-status ${status}`} role="status" aria-live="polite">{status === "sent" ? "Дякуємо! Повідомлення надіслано." : status === "error" ? errorMessage : "Відповімо на вказану електронну адресу."}</p>
  </form>;
}
