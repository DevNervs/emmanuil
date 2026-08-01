"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import { CalendarClock, Church, Globe, HandHeart, Heart, LayoutGrid, Radio, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import { site } from "../content";
import { SiteConfigProvider } from "./SiteConfig";
import { SocialLink } from "./SocialLink";

const nav: Array<[string, string, LucideIcon]> = [
  ["/about/", "Про нас", Church],
  ["/contacts/", "Локації", CalendarClock],
  ["/visit/", "Вперше", HandHeart],
  ["/groups/", "Групи", UsersRound],
  ["/online/", "Онлайн", Radio],
  ["/team/", "Служителі", ShieldCheck],
  ["/europe/", "Європа", Globe],
  ["/departments/", "Служіння", LayoutGrid],
];

function isCurrent(href: string, active?: string) {
  if (!active) return false;
  return active === href || active + "/" === href;
}

function NavLinks({ active }: { active?: string }) {
  return <>{nav.map(([href, label, Icon]) => <a key={href} href={href} data-label={label} aria-current={isCurrent(href, active) ? "page" : undefined}><Icon className="nav-icon" aria-hidden="true" strokeWidth={1.7} /><span className="nav-label">{label}</span></a>)}</>;
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

function applyHeaderCompact(next: boolean) {
  document.documentElement.classList.toggle("hdr-compact", next);
}

function readHeaderCompact() {
  const y = window.scrollY || document.documentElement.scrollTop;
  let current = document.documentElement.classList.contains("hdr-compact");
  if (!current && y >= COMPACT_ON_THRESHOLD) current = true;
  if (current && y <= COMPACT_OFF_THRESHOLD) current = false;
  return current;
}

function getInitialCompact() {
  if (typeof document === "undefined") return false;
  const y = window.scrollY || document.documentElement.scrollTop;
  const current = document.documentElement.classList.contains("hdr-compact");
  if (current && y <= COMPACT_OFF_THRESHOLD) return false;
  return current || y >= COMPACT_ON_THRESHOLD;
}

const SAMPLE_COLS = 5;
const SAMPLE_ROWS = 2;
const MAX_CANVAS_DIM = 250;
const LIGHT_THRESHOLD = 140;
const DARK_THRESHOLD = 110;
const STABLE_FRAMES = 4;
const IMAGE_CACHE_LIMIT = 60;
const COMPACT_ON_THRESHOLD = 32;
const COMPACT_OFF_THRESHOLD = 12;

const imageCanvasCache = new Map<string, HTMLCanvasElement>();
const videoCanvasCache = new Map<HTMLVideoElement, { canvas: HTMLCanvasElement; cropKey: string; lastTime: number }>();

function parseObjectPosition(value: string): number {
  const v = value.trim();
  if (v === "left" || v === "top") return 0;
  if (v === "center") return 0.5;
  if (v === "right" || v === "bottom") return 1;
  if (v.endsWith("%")) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n / 100 : 0.5;
  }
  return 0.5;
}

function parseCssColor(color: string): [number, number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] ? +m[4] : 1];
}

function colorBrightness(r: number, g: number, b: number) {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function isHeaderElement(el: Element) {
  return el.closest(".site-header") !== null;
}

function findDeclaredBrightness(el: Element | null): number {
  let current: Element | null = el;
  while (current) {
    const theme = current.getAttribute("data-header-theme");
    if (theme === "dark") return 30;
    if (theme === "light") return 225;
    current = current.parentElement;
  }
  return 225;
}

function findBackgroundBrightness(el: Element): number | null {
  let current: Element | null = el;
  while (current) {
    const style = getComputedStyle(current as HTMLElement);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) < 0.05) {
      current = current.parentElement;
      continue;
    }
    const theme = current.getAttribute("data-header-theme");
    if (theme === "dark") return 30;
    if (theme === "light") return 225;
    const parsed = parseCssColor(style.backgroundColor);
    if (parsed && parsed[3] > 0.05) {
      return colorBrightness(parsed[0], parsed[1], parsed[2]);
    }
    current = current.parentElement;
  }
  return null;
}

function getImageCrop(media: HTMLImageElement | HTMLVideoElement, rect: DOMRect) {
  const isVideo = media.tagName === "VIDEO";
  const naturalWidth = isVideo ? (media as HTMLVideoElement).videoWidth : (media as HTMLImageElement).naturalWidth;
  const naturalHeight = isVideo ? (media as HTMLVideoElement).videoHeight : (media as HTMLImageElement).naturalHeight;
  if (!naturalWidth || !naturalHeight || !rect.width || !rect.height) return null;

  const style = getComputedStyle(media as HTMLElement);
  const objectFit = style.objectFit;
  const objectPosition = style.objectPosition;
  const [hPosText, vPosText] = objectPosition.split(" ");
  const hPos = parseObjectPosition(hPosText ?? "50%");
  const vPos = parseObjectPosition(vPosText ?? "50%");

  let sx = 0;
  let sy = 0;
  let sw = naturalWidth;
  let sh = naturalHeight;

  if (objectFit === "cover") {
    const srcRatio = naturalWidth / naturalHeight;
    const destRatio = rect.width / rect.height;
    if (srcRatio > destRatio) {
      sh = naturalHeight;
      sw = naturalHeight * destRatio;
      sx = (naturalWidth - sw) * hPos;
      sy = 0;
    } else {
      sw = naturalWidth;
      sh = naturalWidth / destRatio;
      sx = 0;
      sy = (naturalHeight - sh) * vPos;
    }
  }

  const scale = Math.min(1, MAX_CANVAS_DIM / Math.max(sw, sh));
  const destW = Math.max(1, Math.round(sw * scale));
  const destH = Math.max(1, Math.round(sh * scale));

  return { sx, sy, sw, sh, destW, destH };
}

function sampleImage(img: HTMLImageElement, x: number, y: number): number | null {
  if (!img.complete || !img.naturalWidth) return null;
  const rect = img.getBoundingClientRect();
  const crop = getImageCrop(img, rect);
  if (!crop) return null;

  const key = `${img.currentSrc || img.src}::${getComputedStyle(img).objectPosition}::${Math.round(rect.width)}x${Math.round(rect.height)}::${img.naturalWidth}x${img.naturalHeight}`;
  if (imageCanvasCache.size > IMAGE_CACHE_LIMIT) imageCanvasCache.clear();

  let canvas = imageCanvasCache.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = crop.destW;
    canvas.height = crop.destH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    try {
      ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.destW, crop.destH);
      imageCanvasCache.set(key, canvas);
    } catch {
      return null;
    }
  }

  const relX = ((x - rect.left) / rect.width) * crop.destW;
  const relY = ((y - rect.top) / rect.height) * crop.destH;
  const px = Math.max(0, Math.min(canvas.width - 1, Math.round(relX)));
  const py = Math.max(0, Math.min(canvas.height - 1, Math.round(relY)));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    const d = ctx.getImageData(px, py, 1, 1).data;
    return colorBrightness(d[0], d[1], d[2]);
  } catch {
    return null;
  }
}

function sampleVideo(video: HTMLVideoElement, x: number, y: number): number | null {
  if (!video.videoWidth || video.readyState < 2) return null;
  const rect = video.getBoundingClientRect();
  const crop = getImageCrop(video, rect);
  if (!crop) return null;

  const style = getComputedStyle(video);
  const cropKey = `${style.objectPosition}::${Math.round(rect.width)}x${Math.round(rect.height)}::${video.videoWidth}x${video.videoHeight}`;
  let entry = videoCanvasCache.get(video);
  if (!entry || entry.cropKey !== cropKey) {
    const canvas = document.createElement("canvas");
    canvas.width = crop.destW;
    canvas.height = crop.destH;
    entry = { canvas, cropKey, lastTime: -1 };
    videoCanvasCache.set(video, entry);
  }

  if (entry.lastTime !== video.currentTime) {
    const ctx = entry.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    try {
      ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.destW, crop.destH);
      entry.lastTime = video.currentTime;
    } catch {
      return null;
    }
  }

  const relX = ((x - rect.left) / rect.width) * crop.destW;
  const relY = ((y - rect.top) / rect.height) * crop.destH;
  const px = Math.max(0, Math.min(entry.canvas.width - 1, Math.round(relX)));
  const py = Math.max(0, Math.min(entry.canvas.height - 1, Math.round(relY)));
  const ctx = entry.canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    const d = ctx.getImageData(px, py, 1, 1).data;
    return colorBrightness(d[0], d[1], d[2]);
  } catch {
    return null;
  }
}

function findVisibleChildMedia(parent: Element, x: number, y: number): HTMLImageElement | HTMLVideoElement | null {
  for (const child of parent.children) {
    if (child.tagName !== "IMG" && child.tagName !== "VIDEO") continue;
    const style = getComputedStyle(child as HTMLElement);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) < 0.05) continue;
    const rect = (child as HTMLElement).getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return child as HTMLImageElement | HTMLVideoElement;
    }
  }
  return null;
}

function samplePoint(x: number, y: number): number {
  const list = document.elementsFromPoint(x, y);
  let target: Element | null = null;
  for (const el of list) {
    if (isHeaderElement(el)) continue;
    target = el;
    break;
  }
  if (!target) return findDeclaredBrightness(null);

  const childMedia = findVisibleChildMedia(target, x, y);
  if (childMedia) {
    if (childMedia.tagName === "IMG") {
      const b = sampleImage(childMedia as HTMLImageElement, x, y);
      if (b !== null) return b;
    } else if (childMedia.tagName === "VIDEO") {
      const b = sampleVideo(childMedia as HTMLVideoElement, x, y);
      if (b !== null) return b;
    }
  }

  if (target.tagName === "IMG") {
    const b = sampleImage(target as HTMLImageElement, x, y);
    if (b !== null) return b;
  } else if (target.tagName === "VIDEO") {
    const b = sampleVideo(target as HTMLVideoElement, x, y);
    if (b !== null) return b;
  }

  // Iframes / foreign embedded content: do not sample pixels.
  if (target.tagName === "IFRAME" || target.closest("iframe")) {
    return findDeclaredBrightness(target);
  }

  const bg = findBackgroundBrightness(target);
  if (bg !== null) return bg;

  return findDeclaredBrightness(target);
}

function getControlsRect(): DOMRect | null {
  const activeLayer = document.querySelector('.header-layer[aria-hidden="false"]');
  if (activeLayer) {
    const actions = activeLayer.querySelector(".desktop-header-actions, .compact-header-actions");
    if (actions) {
      const r = actions.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return r;
    }
  }

  const mobileMenu = document.querySelector(".mobile-header-shell .mobile-menu");
  if (mobileMenu) {
    const r = mobileMenu.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }

  const inner = document.querySelector(".header-inner");
  if (inner) {
    const r = inner.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }

  const header = document.querySelector(".site-header");
  return header ? header.getBoundingClientRect() : null;
}

function getTopTheme(): "dark" | "light" | null {
  const header = document.querySelector(".site-header");
  const main = document.getElementById("main-content");
  if (!header || !main) return null;
  const rect = header.getBoundingClientRect();

  const sections = main.querySelectorAll("[data-header-theme]");
  for (const section of sections) {
    const sRect = section.getBoundingClientRect();
    if (sRect.top > rect.bottom + 200) break;
    if (sRect.bottom >= rect.top && sRect.top <= rect.bottom + 8) {
      const theme = section.getAttribute("data-header-theme");
      if (theme === "dark" || theme === "light") return theme;
    }
  }

  return null;
}

function getAverageBrightness(): number {
  const rect = getControlsRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return 128;

  let sum = 0;
  let count = 0;
  const colStep = rect.width / (SAMPLE_COLS - 1);
  const rowStep = rect.height / (SAMPLE_ROWS - 1);

  for (let row = 0; row < SAMPLE_ROWS; row++) {
    for (let col = 0; col < SAMPLE_COLS; col++) {
      const x = rect.left + (col === 0 ? 0 : col === SAMPLE_COLS - 1 ? rect.width : col * colStep);
      const y = rect.top + (row === 0 ? 0 : row === SAMPLE_ROWS - 1 ? rect.height : row * rowStep);
      sum += samplePoint(x, y);
      count++;
    }
  }

  return count ? sum / count : 128;
}

function useHeaderSync(_active: string | undefined, setCompact: (compact: boolean) => void) {
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const header = document.querySelector(".site-header") as HTMLElement | null;
    if (!header) return;

    const initialTheme = getTopTheme() ?? "dark";
    let activeTheme: "dark" | "light" = initialTheme;
    let currentCompact = readHeaderCompact();
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    const history: number[] = [];

    function updateTheme() {
      const y = window.scrollY || document.documentElement.scrollTop;

      if (y < 1) {
        const next = getTopTheme() ?? activeTheme;
        if (next !== activeTheme) {
          activeTheme = next;
          applyHeaderTheme(next);
        }
        return;
      }

      const avg = getAverageBrightness();
      history.push(avg);
      while (history.length > STABLE_FRAMES) history.shift();
      const smooth = history.reduce((a, b) => a + b, 0) / history.length;

      const next = activeTheme === "dark"
        ? (smooth > LIGHT_THRESHOLD ? "light" : "dark")
        : (smooth < DARK_THRESHOLD ? "dark" : "light");

      if (next !== activeTheme) {
        activeTheme = next;
        applyHeaderTheme(next);
      }
    }

    function updateCompact() {
      const y = window.scrollY || document.documentElement.scrollTop;
      let next = currentCompact;
      if (!currentCompact && y >= COMPACT_ON_THRESHOLD) next = true;
      if (currentCompact && y <= COMPACT_OFF_THRESHOLD) next = false;

      if (next !== currentCompact) {
        currentCompact = next;
        applyHeaderCompact(next);
        setCompact(next);
      }
    }

    function tick() {
      rafId = 0;
      updateCompact();
      updateTheme();
    }

    function schedule() {
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    }

    applyHeaderCompact(currentCompact);
    setCompact(currentCompact);
    applyHeaderTheme(activeTheme);
    updateTheme();

    const bootFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => document.documentElement.classList.remove("hdr-boot"));
    });

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const onLoad = () => schedule();
    window.addEventListener("load", onLoad);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(header);
      const main = document.getElementById("main-content");
      if (main) resizeObserver.observe(main);
    }

    return () => {
      cancelAnimationFrame(bootFrame);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", onLoad);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [setCompact]);
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

export function SiteHeader({ active }: { active?: string }) {
  const [compact, setCompact] = useState(getInitialCompact);
  useHeaderSync(active, setCompact);
  return <>
    <header className="site-header">
      <div className="header-inner">
        <div className="desktop-header-shell">
          <div className="header-layer header-layer-default" aria-hidden={compact}>
            <Brand />
            <div className="desktop-header-actions">
              <nav className="main-nav main-nav-default" aria-label="Основна навігація"><NavLinks active={active} /></nav>
              <a className="donate-link header-donate" href="/donate/"><span className="donate-label">Пожертвувати</span></a>
            </div>
          </div>
          <div className="header-layer header-layer-compact" aria-hidden={!compact}>
            <Brand />
            <div className="compact-header-actions">
              <nav className="main-nav compact-nav" aria-label="Компактна навігація"><NavLinks active={active} /></nav>
              <a className="donate-link compact-donate" href="/donate/" data-label="Пожертвувати" aria-label="Пожертвувати"><Heart aria-hidden="true" strokeWidth={1.8} /></a>
            </div>
          </div>
        </div>
        <div className="mobile-header-shell">
          <Brand />
          <details className="mobile-menu">
            <summary aria-label="Меню">
              <span className="menu-burger" aria-hidden="true"><i /><i /><i /></span>
            </summary>
            <nav aria-label="Мобільна навігація"><NavLinks active={active} /><a href="/donate/">Пожертвувати</a></nav>
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
        <nav className="footer-column" aria-label="Розділи сайту"><span>Розділи</span><a href="/about/">Про нас</a><a href="/contacts/">Графік служінь та локації</a><a href="/visit/">Вперше у нас</a><a href="/groups/">Домашні групи</a><a href="/online/">Онлайн</a></nav>
        <nav className="footer-column" aria-label="Додаткові розділи"><span>Додатково</span><a href="/team/">Служителі</a><a href="/europe/">Церкви в Європі</a><a href="/departments/">Департаменти</a><a href="/virovchennja/">Основи віровчення УЦХВЄ</a><a href="/donate/">Пожертвувати</a><a href="/contacts/">Контактна інформація</a><a href="/privacy/">Конфіденційність</a></nav>
        <address className="footer-column"><span>Контакти</span><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a><div className="social-links"><SocialLink network="facebook" href={site.socials.facebook} /><SocialLink network="instagram" href={site.socials.instagram} /><SocialLink network="youtube" href={site.socials.youtube} /><SocialLink network="telegram" href={site.socials.telegram} /></div></address>
      </div>
      <div className="footer-bottom"><span>© 2026 {site.shortName}</span><a href="/privacy/">Політика конфіденційності</a><span>Християнська церква у Чернівцях</span></div>
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
