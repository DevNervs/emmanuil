import type { ReactNode } from "react";
import { site } from "../content";

const nav = [
  ["/", "Головна"],
  ["/about", "Про нас"],
  ["/groups", "Спільнота"],
  ["/team", "Команда"],
  ["/online", "Онлайн"],
  ["/contacts", "Контакти"],
];

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a className={`brand ${light ? "brand-light" : ""}`} href="/" aria-label="Еммануїл — головна сторінка">
      <span className="brand-cross" aria-hidden="true">+</span>
      <span className="brand-copy"><strong>Еммануїл</strong><small>євангельська церква</small></span>
    </a>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Основна навігація">
          {nav.map(([href, label]) => (
            <a key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</a>
          ))}
        </nav>
        <a className="donate-link" href="/donate">Я хочу підтримати</a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Brand light />
        <p>Церква, де можна бути собою, зростати у вірі та не йти дорогою наодинці.</p>
      </div>
      <div className="footer-column">
        <span>Навігація</span>
        <a href="/about">Про нас</a>
        <a href="/groups">Домашні групи</a>
        <a href="/team">Наша команда</a>
        <a href="/online">Онлайн</a>
      </div>
      <address className="footer-column">
        <span>Контакти</span>
        <a href="https://maps.google.com/?q=48.2861034,25.9393799">{site.address}</a>
        <a href="tel:+380506021866">{site.phone}</a>
        <a href="mailto:emmanuil.cv@gmail.com">{site.email}</a>
      </address>
      <div className="footer-bottom">© 2026 {site.shortName}. Усі права захищені.</div>
    </footer>
  );
}

export function Page({ children, active }: { children: ReactNode; active?: string }) {
  return <><SiteHeader active={active} />{children}<Footer /></>;
}

export function PageHero({ eyebrow, title, text, image, children }: { eyebrow: string; title: ReactNode; text: string; image: string; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="page-hero-copy">
        <p className="overline">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
      </div>
      <div className="page-hero-image"><img src={image} alt="" /></div>
    </section>
  );
}

export function SectionTitle({ kicker, title, text }: { kicker: string; title: ReactNode; text?: string }) {
  return (
    <div className="section-title">
      <p className="overline">{kicker}</p>
      <h2>{title}</h2>
      {text ? <p className="section-description">{text}</p> : null}
    </div>
  );
}
