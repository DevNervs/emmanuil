"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpenText, CirclePlay, ContactRound, Heart, Home, MapPinned, Newspaper, UsersRound, type LucideIcon } from "lucide-react";
import { site } from "../content";
import { SocialLink } from "./SocialLink";

const nav: Array<[string, string, LucideIcon]> = [
  ["/", "Головна", Home],
  ["/news", "Новини", Newspaper],
  ["/online", "Онлайн", CirclePlay],
  ["/about", "Ми віримо", BookOpenText],
  ["/groups", "Домашні групи", MapPinned],
  ["/team", "Команда", UsersRound],
  ["/contacts", "Контакти", ContactRound],
];

const footerLocations = [
  { label: "Церква Еммануїл", address: "м. Чернівці, вул. О. Кобилянської, 53", coordinates: "48.2864175,25.9394979", note: site.services },
  { label: "Криворучка", address: "м. Чернівці, вул. Ореста Криворучка, 57", coordinates: "48.2786111,25.9200516" },
  { label: "Садгора", address: "м. Чернівці, вул. Васіле Александрі, 8", coordinates: "48.3464098,25.9594925" },
  { label: "Сторожинець", address: "м. Сторожинець, вул. Українська, 5", coordinates: "48.1640400,25.7212200" },
];

function NavLinks({ active }: { active?: string }) {
  return <>{nav.map(([href, label, Icon]) => <a key={href} href={href} data-label={label} aria-current={active === href ? "page" : undefined}><Icon className="nav-icon" aria-hidden="true" strokeWidth={1.7} /><span className="nav-label">{label}</span></a>)}</>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`brand ${light ? "brand-light" : ""}`} href="/" aria-label="Християнська церква Еммануїл Чернівці"><img src="/emmanuil-logo-hq.png" width="2172" height="216" alt="Християнська церква Еммануїл Чернівці" /></Link>;
}

export function SiteHeader({ active }: { active?: string }) {
  const [compact, setCompact] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  return <>
    <span ref={sentinelRef} className="header-sentinel" aria-hidden="true" />
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <div className="header-inner">
        <div className="desktop-header-shell">
          <div className="header-layer header-layer-default" aria-hidden={compact}>
            <Brand />
            <div className="desktop-header-actions">
              <nav className="main-nav main-nav-default" aria-label="Основна навігація"><NavLinks active={active} /></nav>
              <a className="donate-link header-donate" href="/donate"><span className="donate-label">Пожертвувати</span></a>
            </div>
          </div>
          <div className="header-layer header-layer-compact" aria-hidden={!compact}>
            <Brand />
            <div className="compact-header-actions">
              <nav className="main-nav compact-nav" aria-label="Компактна навігація"><NavLinks active={active} /></nav>
              <a className="donate-link compact-donate" href="/donate" data-label="Пожертвувати" aria-label="Пожертвувати"><Heart aria-hidden="true" strokeWidth={1.8} /></a>
            </div>
          </div>
        </div>
        <div className="mobile-header-shell">
          <Brand />
          <details className="mobile-menu">
            <summary>Меню</summary>
            <nav aria-label="Мобільна навігація"><NavLinks active={active} /><a href="/donate">Пожертвувати</a></nav>
          </details>
        </div>
      </div>
    </header>
  </>;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main"><Brand light /><div className="footer-locations">{footerLocations.map((location) => <div className="footer-location" key={location.label}><div><strong>{location.label}</strong><p>{location.address}</p>{location.note ? <small>{location.note}</small> : null}</div><a className="footer-route" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.coordinates)}`} target="_blank" rel="noreferrer" aria-label={`Прокласти маршрут: ${location.label}`}>Прокласти маршрут <span aria-hidden="true">↗</span></a></div>)}</div></div>
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
