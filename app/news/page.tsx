import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { news } from "../content";

export const metadata: Metadata = { title: "Новини — Еммануїл", description: "Останні новини християнської церкви Еммануїл у Чернівцях." };

export default function NewsPage() {
  return <Page active="/news"><main><PageIntro eyebrow="Життя церкви" title="Новини" image="/media/noti.jpg" imageAlt="Ноти вдячності" /><section className="news-section news-page-grid"><div className="news-grid">{news.map((item, index) => <article className="news-card" key={item.href}><a className="news-image" href={item.href} target="_blank" rel="noreferrer"><img src={item.image} alt={item.title} /><span aria-hidden="true">↗</span></a><div className="news-meta"><time>{item.date}</time><span>{String(index + 1).padStart(2, "0")}</span></div><h3>{item.title}</h3><a className="inline-link" href={item.href} target="_blank" rel="noreferrer">Читати новину</a></article>)}</div></section></main></Page>;
}
