import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../components/JsonLd";
import { Page } from "../../components/SiteShell";
import { news, newsHref, site } from "../../content";
import { buildBreadcrumbList, absoluteUrl, pageMetadata } from "../../seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return news.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = news.find((entry) => entry.slug === slug);
  if (!item) return {};
  return pageMetadata({
    path: `/news/${slug}`,
    title: item.title,
    description: item.summary,
    type: "article",
    publishedTime: item.publishedAt,
    images: [{ url: item.image, alt: item.title }],
  });
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const index = news.findIndex((entry) => entry.slug === slug);
  if (index < 0) notFound();
  const item = news[index];
  const previous = news[index - 1];
  const next = news[index + 1];
  const latest = news.filter((entry) => entry.slug !== slug).slice(0, 3);
  const canonical = absoluteUrl(newsHref(item));
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt,
    dateModified: item.publishedAt,
    inLanguage: "uk-UA",
    image: [absoluteUrl(item.image)],
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: site.legalName, url: absoluteUrl("/") },
    publisher: {
      "@type": "Church",
      name: site.legalName,
      url: absoluteUrl("/"),
      logo: { "@type": "ImageObject", url: absoluteUrl("/emmanuil-logo-hq.png") },
    },
    isAccessibleForFree: true,
  };
  const breadcrumbSchema = buildBreadcrumbList([
    { name: "Головна", path: "/" },
    { name: "Архів публікацій", path: "/news" },
    { name: item.title, path: newsHref(item) },
  ]);

  return (
    <Page active="/news">
      <main className="article-page">
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <header className="article-hero">
          <div className="article-heading">
            <nav className="article-breadcrumb" aria-label="Навігаційний шлях">
              <a href="/">Головна</a>
              <span>/</span>
              <a href="/news">Архів</a>
            </nav>
            <p className="overline">
              {item.category} · Архів
            </p>
            <span className="archive-badge">Подія завершена</span>
            <h1>{item.title}</h1>
            <time dateTime={item.publishedAt}>{item.date}</time>
          </div>
          <figure className="article-cover">
            <img src={item.image} alt={item.title} fetchPriority="high" decoding="async" />
          </figure>
        </header>
        <article className="article-content">
          <div className="article-copy">
            {item.body.length ? (
              item.body.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)
            ) : (
              <p className="article-caption">Інформація представлена на афіші події.</p>
            )}
          </div>
          <aside className="article-aside">
            <span>Опубліковано</span>
            <strong>{item.date}</strong>
            <p>Цей матеріал збережено як частину архіву життя церкви.</p>
            <a className="inline-link" href="/news">
              Увесь архів
            </a>
          </aside>
        </article>
        <nav className="article-pager" aria-label="Сусідні новини">
          {previous ? (
            <a href={newsHref(previous)}>
              <span>← Попередня</span>
              <strong>{previous.title}</strong>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={newsHref(next)}>
              <span>Наступна →</span>
              <strong>{next.title}</strong>
            </a>
          ) : (
            <span />
          )}
        </nav>
        <section className="article-latest">
          <div className="article-latest-title">
            <p className="overline">Читайте також</p>
            <h2>З архіву</h2>
          </div>
          <div className="article-latest-grid">
            {latest.map((entry) => (
              <a href={newsHref(entry)} key={entry.slug}>
                <img src={entry.image} alt="" loading="lazy" decoding="async" />
                <time dateTime={entry.publishedAt}>{entry.date} · Подія завершена</time>
                <strong>{entry.title}</strong>
              </a>
            ))}
          </div>
        </section>
      </main>
    </Page>
  );
}
