"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import { CalendarClock, Church, Globe, HandHeart, Heart, LayoutGrid, Radio, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import { site } from "../content";
import { SiteConfigProvider } from "./SiteConfig";
import { SocialLink } from "./SocialLink";

const nav: Array<[string, string, LucideIcon]> = [
  ["/about", "Про нас", Church],
  ["/contacts", "Локації", CalendarClock],
  ["/visit", "Вперше", HandHeart],
  ["/groups", "Групи", UsersRound],
  ["/online", "Онлайн", Radio],
  ["/team", "Служителі", ShieldCheck],
  ["/europe", "Європа", Globe],
  ["/departments", "Служіння", LayoutGrid],
];

function NavLinks({ active }: { active?: string }) {
  return <>{nav.map(([href, label, Icon]) => <a key={href} href={href} data-label={label} aria-current={active === href ? "page" : undefined}><Icon className="nav-icon" aria-hidden="true" strokeWidth={1.7} /><span className="nav-label">{label}</span></a>)}</>;
}

export function Brand() {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a className="brand" href="/" aria-label="Християнська церква Еммануїл Чернівці">
      <img
        className="brand-logo-dark"
        src="/emmanuil-logo-brand.png"
        srcSet="/emmanuil-logo-brand-720.png 720w, /emmanuil-logo-brand.png 5776w"
        sizes="(max-width: 1000px) 14rem, 22rem"
        width="360"
        height="60"
        alt="Християнська церква Еммануїл Чернівці"
        decoding="async"
        loading="lazy"
      />
      <img
        className="brand-logo-light"
        src="/emmanuil-logo-brand-light.png"
        srcSet="/emmanuil-logo-brand-light-720.png 720w, /emmanuil-logo-brand-light.png 5776w"
        sizes="(max-width: 1000px) 14rem, 22rem"
        width="360"
        height="60"
        alt="Християнська церква Еммануїл Чернівці"
        decoding="async"
        fetchPriority="high"
      />
    </a>
  );
}

function applyHeaderTheme(next: "dark" | "light") {
  document.documentElement.setAttribute("data-header-theme", next);
}

/** Same-page # links: smooth scrollIntoView for Safari/Chrome; no wheel hijacking. */
function useSmoothHashLinks() {
  useLayoutEffect(() => {
    const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollToId = (hash: string) => {
      if (!hash || hash === "#") return false;
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* keep raw id */
      }
      const el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
      return true;
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname || url.search !== window.location.search) return;
      if (!url.hash) return;
      if (!scrollToId(url.hash)) return;
      event.preventDefault();
      if (history.pushState) history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      else window.location.hash = url.hash;
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

function applyHeaderCompact(next: boolean) {
  document.documentElement.classList.toggle("hdr-compact", next);
}

function getInitialCompact() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("hdr-compact") || (window.scrollY || document.documentElement.scrollTop) >= 72;
}

export function SiteHeader({ active }: { active?: string }) {
  const [compact, setCompact] = useState(getInitialCompact);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>(".site-header");
    const sections = Array.from(root.querySelectorAll<HTMLElement>("#main-content [data-header-theme]"));
    let activeTheme = root.getAttribute("data-header-theme");
    let frame = 0;

    // Pick the theme of the section that covers most of the header band [0, headerBottom],
    // so the panel colour always matches the background actually behind it.
    const syncTheme = () => {
      if (!sections.length) return;
      const line = header ? header.getBoundingClientRect().bottom : 88;
      let bestTheme: string | null = null;
      let bestCoverage = 0;
      let trailingTheme: string | null = null;
      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        const coverage = Math.min(rect.bottom, line) - Math.max(rect.top, 0);
        if (coverage > bestCoverage) {
          bestCoverage = coverage;
          bestTheme = el.getAttribute("data-header-theme");
        }
        if (rect.top <= line) trailingTheme = el.getAttribute("data-header-theme");
      }
      const next = bestCoverage > 0 ? bestTheme : trailingTheme;
      if ((next === "dark" || next === "light") && next !== activeTheme) {
        activeTheme = next;
        applyHeaderTheme(next);
      }
    };

    const run = () => {
      frame = 0;
      const y = window.scrollY || root.scrollTop;
      setCompact((prev) => {
        let next = prev;
        if (!prev && y >= 72) next = true;
        if (prev && y <= 28) next = false;
        if (next !== prev) applyHeaderCompact(next);
        return next;
      });
      syncTheme();
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(run);
    };

    syncTheme();
    onScroll();
    const bootFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("hdr-boot"));
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("load", onScroll);

    // Re-sync when late content (video, images) reflows sections under the header.
    const main = document.getElementById("main-content");
    const resizeObserver = main ? new ResizeObserver(onScroll) : null;
    if (main && resizeObserver) resizeObserver.observe(main);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
      resizeObserver?.disconnect();
      cancelAnimationFrame(bootFrame);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active]);
  return <>
    <header className="site-header">
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
            <summary aria-label="Меню">
              <span className="menu-burger" aria-hidden="true"><i /><i /><i /></span>
            </summary>
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
      <div className="footer-top">
        <nav className="footer-column" aria-label="Розділи сайту"><span>Розділи</span><a href="/about">Про нас</a><a href="/contacts">Графік служінь та локації</a><a href="/visit">Вперше у нас</a><a href="/groups">Домашні групи</a><a href="/online">Онлайн</a></nav>
        <nav className="footer-column" aria-label="Додаткові розділи"><span>Додатково</span><a href="/team">Служителі</a><a href="/europe">Церкви в Європі</a><a href="/departments">Департаменти</a><a href="/virovchennja">Основи віровчення УЦХВЄ</a><a href="/donate">Пожертвувати</a><a href="/contacts">Контактна інформація</a><a href="/privacy">Конфіденційність</a></nav>
        <address className="footer-column"><span>Контакти</span><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a><div className="social-links"><SocialLink network="facebook" href={site.socials.facebook} /><SocialLink network="instagram" href={site.socials.instagram} /><SocialLink network="youtube" href={site.socials.youtube} /><SocialLink network="telegram" href={site.socials.telegram} /></div></address>
      </div>
      <div className="footer-bottom"><span>© 2026 {site.shortName}</span><a href="/privacy">Політика конфіденційності</a><span>Християнська церква у Чернівцях</span></div>
    </footer>
  );
}

export function Page({ children, active }: { children: ReactNode; active?: string }) {
  useSmoothHashLinks();
  return (
    <SiteConfigProvider>
      <a className="skip-link" href="#main-content">Перейти до вмісту</a>
      <SiteHeader active={active} />
      <div id="main-content" tabIndex={-1}>{children}</div>
      <Footer />
    </SiteConfigProvider>
  );
}

export function PageIntro({ eyebrow, title, text, children, image, imageAlt = "", mediaClassName = "" }: { eyebrow?: string; title: ReactNode; text?: ReactNode; children?: ReactNode; image?: string; imageAlt?: string; mediaClassName?: string }) {
  return <section data-header-theme="dark" className={`page-intro ${image ? "page-intro-visual" : ""}`}><div className="page-intro-copy">{eyebrow ? <p className="overline">{eyebrow}</p> : null}<h1>{title}</h1>{text ? <div className="intro-text">{text}</div> : null}{children}</div>{image ? <div className={`page-intro-media ${mediaClassName}`.trim()}><img src={image} alt={imageAlt} fetchPriority="high" decoding="async" /></div> : null}</section>;
}

export function SectionTitle({ kicker, title, text }: { kicker?: string; title: ReactNode; text?: ReactNode }) {
  return <div className="section-title">{kicker ? <p className="overline">{kicker}</p> : null}<h2>{title}</h2>{text ? <div className="section-description">{text}</div> : null}</div>;
}
