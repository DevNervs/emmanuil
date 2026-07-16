import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Page } from "../../components/SiteShell";
import { news, newsHref } from "../../content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return news.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = news.find((entry) => entry.slug === slug);
  if (!item) return {};
  return { title: `${item.title} — Еммануїл`, description: item.body[0] || item.title, alternates: { canonical: `/news/${slug}` }, openGraph: { title: item.title, description: item.body[0] || item.title, images: [item.image] } };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const index = news.findIndex((entry) => entry.slug === slug);
  if (index < 0) notFound();
  const item = news[index];
  const previous = news[index - 1];
  const next = news[index + 1];
  const latest = news.filter((entry) => entry.slug !== slug).slice(0, 3);

  return <Page active="/news"><main className="article-page">
    <header className="article-hero">
      <div className="article-heading"><nav className="article-breadcrumb" aria-label="Навігаційний шлях"><a href="/">Головна</a><span>/</span><a href="/news">Новини</a></nav><p className="overline">Новини церкви</p><h1>{item.title}</h1><time>{item.date}</time></div>
      <figure className="article-cover"><img src={item.image} alt={item.title} fetchPriority="high" /></figure>
    </header>
    <article className="article-content">
      <div className="article-copy">{item.body.length ? item.body.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>) : <p className="article-caption">Інформація представлена на афіші події.</p>}</div>
      <aside className="article-aside"><span>Опубліковано</span><strong>{item.date}</strong><a className="inline-link" href="/news">Усі новини</a></aside>
    </article>
    <nav className="article-pager" aria-label="Сусідні новини">{previous ? <a href={newsHref(previous)}><span>← Попередня</span><strong>{previous.title}</strong></a> : <span />}{next ? <a href={newsHref(next)}><span>Наступна →</span><strong>{next.title}</strong></a> : <span />}</nav>
    <section className="article-latest"><div className="article-latest-title"><p className="overline">Читайте також</p><h2>Останні новини</h2></div><div className="article-latest-grid">{latest.map((entry) => <a href={newsHref(entry)} key={entry.slug}><img src={entry.image} alt="" loading="lazy" /><time>{entry.date}</time><strong>{entry.title}</strong></a>)}</div></section>
  </main></Page>;
}
