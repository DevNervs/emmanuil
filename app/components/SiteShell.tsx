import type { ReactNode } from "react";
import { site } from "../content";

const nav = [
  ["/", "Головна"],
  ["/news", "Новини"],
  ["/about", "Ми віримо"],
  ["/team", "Команда"],
  ["/groups", "Домашні групи"],
  ["/online", "Онлайн"],
  ["/contacts", "Контакти"],
];

function NavLinks({ active }: { active?: string }) {
  return <>{nav.map(([href, label]) => <a key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</a>)}</>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand ${light ? "brand-light" : ""}`} href="/" aria-label="Християнська церква Еммануїл Чернівці"><img src="/emmanuil-logo.png" alt="Християнська церква Еммануїл Чернівці" /></a>;
}

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Основна навігація"><NavLinks active={active} /></nav>
        <a className="donate-link" href="/donate">Пожертвувати</a>
        <details className="mobile-menu">
          <summary>Меню</summary>
          <nav aria-label="Мобільна навігація"><NavLinks active={active} /><a href="/donate">Пожертвувати</a></nav>
        </details>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main"><Brand light /><p>{site.address}</p><p>{site.services}</p></div>
      <div className="footer-column"><span>Розділи</span><a href="/news">Новини</a><a href="/about">Ми віримо</a><a href="/team">Команда</a><a href="/groups">Домашні групи</a><a href="/online">Онлайн</a></div>
      <address className="footer-column"><span>Контакти</span><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a><div className="social-links"><a href={site.socials.facebook} target="_blank" rel="noreferrer">Facebook</a><a href={site.socials.instagram} target="_blank" rel="noreferrer">Instagram</a><a href={site.socials.youtube} target="_blank" rel="noreferrer">YouTube</a><a href={site.socials.telegram} target="_blank" rel="noreferrer">Telegram</a></div></address>
      <div className="footer-bottom">© 2026 {site.shortName}</div>
    </footer>
  );
}

export function Page({ children, active }: { children: ReactNode; active?: string }) {
  return <><a className="skip-link" href="#main-content">Перейти до вмісту</a><SiteHeader active={active} /><div id="main-content" tabIndex={-1}>{children}</div><Footer /></>;
}

export function PageIntro({ eyebrow, title, text, children, home = false }: { eyebrow?: string; title: ReactNode; text?: ReactNode; children?: ReactNode; home?: boolean }) {
  return <section className={`page-intro ${home ? "home-intro" : ""}`}>{eyebrow ? <p className="overline">{eyebrow}</p> : null}<h1>{title}</h1>{text ? <div className="intro-text">{text}</div> : null}{children}</section>;
}

export function SectionTitle({ kicker, title, text }: { kicker?: string; title: ReactNode; text?: ReactNode }) {
  return <div className="section-title">{kicker ? <p className="overline">{kicker}</p> : null}<h2>{title}</h2>{text ? <div className="section-description">{text}</div> : null}</div>;
}
