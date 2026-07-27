import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { news, newsHref } from "../content";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/news",
  title: "Новини та архів життя церкви",
  description: "Події, історії, відео та архів життя християнської церкви Еммануїл у Чернівцях.",
});

export default function NewsPage() {
  return (
    <Page active="/news">
      <main>
        <JsonLd data={breadcrumbFor("/news", "Архів публікацій")} />
        <PageIntro
          eyebrow="З життя церкви"
          title={
            <>
              Архів
              <br />
              публікацій
            </>
          }
          text={<p>Події, історії та відео з попередніх років. Усі події в цьому розділі вже завершилися.</p>}
          image="/media/news-worship.webp?v=q2"
          imageAlt="Музичне служіння церкви Еммануїл"
        />
        <section className="news-section news-list-section" aria-label="Архів публікацій">
          <div className="news-list">
            {news.map((item) => (
              <article className="news-list-item" key={item.slug}>
                <a className="news-list-media" href={newsHref(item)} tabIndex={-1} aria-hidden="true">
                  <img src={item.image} alt="" loading="lazy" decoding="async" />
                </a>
                <div className="news-list-copy">
                  <div className="news-meta">
                    <time dateTime={item.publishedAt}>{item.date}</time>
                    <span>{item.category}</span>
                  </div>
                  <span className="archive-badge">Подія завершена</span>
                  <h3>
                    <a href={newsHref(item)}>{item.title}</a>
                  </h3>
                  <p className="news-summary">{item.summary}</p>
                  <a className="inline-link" href={newsHref(item)}>
                    Переглянути архів
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Page>
  );
}
