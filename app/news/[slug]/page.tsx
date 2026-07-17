import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Page } from "../../components/SiteShell";
import { news, newsHref, site } from "../../content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return news.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = news.find((entry) => entry.slug === slug);
  if (!item) return {};
  return { title: item.title, description: item.summary, alternates: { canonical: `/news/${slug}` }, openGraph: { title: item.title, description: item.summary, type: "article", publishedTime: item.publishedAt, url: `/news/${slug}`, images: [item.image] } };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const index = news.findIndex((entry) => entry.slug === slug);
  if (index < 0) notFound();
  const item = news[index];
  const previous = news[index - 1];
  const next = news[index + 1];
  const latest = news.filter((entry) => entry.slug !== slug).slice(0, 3);
  const canonical = `${site.canonicalUrl}${newsHref(item)}`;
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: item.title, description: item.summary, datePublished: item.publishedAt, image: `${site.canonicalUrl}${item.image}`, mainEntityOfPage: canonical, publisher: { "@type": "Church", name: "Християнська церква Еммануїл", url: site.canonicalUrl } };
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Головна", item: site.canonicalUrl }, { "@type": "ListItem", position: 2, name: "Архів публікацій", item: `${site.canonicalUrl}/news` }, { "@type": "ListItem", position: 3, name: item.title, item: canonical }] };

  return <Page active="/news"><main className="article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <header className="article-hero">
      <div className="article-heading"><nav className="article-breadcrumb" aria-label="Навігаційний шлях"><a href="/">Головна</a><span>/</span><a href="/news">Архів</a></nav><p className="overline">{item.category} · Архів</p><span className="archive-badge">Подія завершена</span><h1>{item.title}</h1><time dateTime={item.publishedAt}>{item.date}</time></div>
      <figure className="article-cover"><img src={item.image} alt={item.title} fetchPriority="high" decoding="async" /></figure>
    </header>
    <article className="article-content">
      <div className="article-copy">{item.body.length ? item.body.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>) : <p className="article-caption">Інформація представлена на афіші події.</p>}</div>
      <aside className="article-aside"><span>Опубліковано</span><strong>{item.date}</strong><p>Цей матеріал збережено як частину архіву життя церкви.</p><a className="inline-link" href="/news">Увесь архів</a></aside>
    </article>
    <nav className="article-pager" aria-label="Сусідні новини">{previous ? <a href={newsHref(previous)}><span>← Попередня</span><strong>{previous.title}</strong></a> : <span />}{next ? <a href={newsHref(next)}><span>Наступна →</span><strong>{next.title}</strong></a> : <span />}</nav>
    <section className="article-latest"><div className="article-latest-title"><p className="overline">Читайте також</p><h2>З архіву</h2></div><div className="article-latest-grid">{latest.map((entry) => <a href={newsHref(entry)} key={entry.slug}><img src={entry.image} alt="" loading="lazy" decoding="async" /><time dateTime={entry.publishedAt}>{entry.date} · Подія завершена</time><strong>{entry.title}</strong></a>)}</div></section>
  </main></Page>;
}
