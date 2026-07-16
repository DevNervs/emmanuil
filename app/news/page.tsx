import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { news, newsHref } from "../content";

export const metadata: Metadata = { title: "Архів життя церкви — Еммануїл", description: "Архів подій, історій та відео християнської церкви Еммануїл у Чернівцях.", alternates: { canonical: "/news" } };

export default function NewsPage() {
  return <Page active="/news"><main><PageIntro eyebrow="З життя церкви" title={<>Архів<br />публікацій</>} text={<p>Події, історії та відео з попередніх років. Усі події в цьому розділі вже завершилися.</p>} image="/media/noti.jpg" imageAlt="Ноти вдячності" /><section className="news-section news-page-grid"><div className="news-grid">{news.map((item) => <article className="news-card" key={item.slug}><a className="news-image" href={newsHref(item)}><img src={item.image} alt={item.title} loading="lazy" decoding="async" /><span aria-hidden="true">→</span></a><div className="news-meta"><time dateTime={item.publishedAt}>{item.date}</time><span>{item.category}</span></div><span className="archive-badge">Подія завершена</span><h3><a href={newsHref(item)}>{item.title}</a></h3><p className="news-summary">{item.summary}</p><a className="inline-link" href={newsHref(item)}>Переглянути архів</a></article>)}</div></section></main></Page>;
}
