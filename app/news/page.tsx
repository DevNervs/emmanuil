import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { news } from "../content";

export const metadata: Metadata = { title: "Новини — Еммануїл", description: "Останні новини християнської церкви Еммануїл у Чернівцях." };

export default function NewsPage() {
  return <Page active="/news"><main><PageIntro title="Новини" /><section className="news-section news-page-grid"><div className="news-grid">{news.map((item) => <article className="news-card" key={item.href}><a href={item.href} target="_blank" rel="noreferrer"><img src={item.image} alt={item.title} /></a><time>{item.date}</time><h3>{item.title}</h3><a className="inline-link" href={item.href} target="_blank" rel="noreferrer">Читати на emmanuil.cv.ua <span aria-hidden="true">↗</span></a></article>)}</div></section></main></Page>;
}
