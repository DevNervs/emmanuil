"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenText, CirclePlay, ContactRound, Heart, Home, MapPinned, Newspaper, UsersRound, type LucideIcon } from "lucide-react";
import { site } from "../content";
import { SocialLink } from "./SocialLink";

const nav: Array<[string, string, LucideIcon]> = [
  ["/", "Головна", Home],
  ["/news", "Новини", Newspaper],
  ["/about", "Ми віримо", BookOpenText],
  ["/team", "Команда", UsersRound],
  ["/groups", "Домашні групи", MapPinned],
  ["/online", "Онлайн", CirclePlay],
  ["/contacts", "Контакти", ContactRound],
];

function NavLinks({ active }: { active?: string }) {
  return <>{nav.map(([href, label, Icon]) => <a key={href} href={href} data-label={label} aria-current={active === href ? "page" : undefined}><Icon className="nav-icon" aria-hidden="true" strokeWidth={1.7} /><span className="nav-label">{label}</span></a>)}</>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`brand ${light ? "brand-light" : ""}`} href="/" aria-label="Християнська церква Еммануїл Чернівці"><img src="/emmanuil-logo-transparent.png" alt="Християнська церква Еммануїл Чернівці" /></Link>;
}

export function SiteHeader({ active }: { active?: string }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setCompact((current) => current ? window.scrollY > 18 : window.scrollY > 96);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <div className="header-inner">
        <Brand />
        <div className="desktop-header-actions">
          <nav className="main-nav" aria-label="Основна навігація"><NavLinks active={active} /></nav>
          <a className="donate-link header-donate" href="/donate" data-label="Пожертвувати"><Heart className="donate-icon" aria-hidden="true" strokeWidth={1.8} /><span className="donate-label">Пожертвувати</span></a>
        </div>
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
      <div className="footer-main"><Brand light /><p>{site.address}</p><p>{site.services}</p><a className="footer-route" href="https://www.google.com/maps/dir/?api=1&destination=48.2864175%2C25.9394979" target="_blank" rel="noreferrer">Прокласти маршрут ↗</a></div>
      <div className="footer-column"><span>Розділи</span><a href="/news">Новини</a><a href="/about">Ми віримо</a><a href="/team">Команда</a><a href="/groups">Домашні групи</a><a href="/online">Онлайн</a></div>
      <address className="footer-column"><span>Контакти</span><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a><div className="social-links"><SocialLink network="facebook" href={site.socials.facebook} /><SocialLink network="instagram" href={site.socials.instagram} /><SocialLink network="youtube" href={site.socials.youtube} /><SocialLink network="telegram" href={site.socials.telegram} /></div></address>
      <div className="footer-bottom"><span>© 2026 {site.shortName}</span><span>Християнська церква у Чернівцях</span></div>
    </footer>
  );
}

export function Page({ children, active }: { children: ReactNode; active?: string }) {
  return <><a className="skip-link" href="#main-content">Перейти до вмісту</a><SiteHeader active={active} /><div id="main-content" tabIndex={-1}>{children}</div><Footer /></>;
}

export function PageIntro({ eyebrow, title, text, children, image, imageAlt = "" }: { eyebrow?: string; title: ReactNode; text?: ReactNode; children?: ReactNode; image?: string; imageAlt?: string }) {
  return <section className={`page-intro ${image ? "page-intro-visual" : ""}`}><div className="page-intro-copy">{eyebrow ? <p className="overline">{eyebrow}</p> : null}<h1>{title}</h1>{text ? <div className="intro-text">{text}</div> : null}{children}</div>{image ? <div className="page-intro-media"><img src={image} alt={imageAlt} fetchPriority="high" /></div> : null}</section>;
}

export function SectionTitle({ kicker, title, text }: { kicker?: string; title: ReactNode; text?: ReactNode }) {
  return <div className="section-title">{kicker ? <p className="overline">{kicker}</p> : null}<h2>{title}</h2>{text ? <div className="section-description">{text}</div> : null}</div>;
}
