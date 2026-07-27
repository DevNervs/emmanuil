import { LiveStream } from "./components/LiveStream";
import { NextService } from "./components/NextService";
import { Page } from "./components/SiteShell";
import { groupSeason, groups, news, newsHref } from "./content";
import { pageMetadata } from "./seo";

export const metadata = pageMetadata({
  path: "/",
  title: { absolute: "Церква Еммануїл у Чернівцях | Християнська євангельська церква" },
  description:
    "Християнська євангельська церква Еммануїл у Чернівцях: недільні служіння о 10:00 та 17:00 на 4 локаціях, домашні групи, онлайн-трансляції та контакти.",
  ogTitle: "Еммануїл — християнська церква у Чернівцях",
  ogDescription:
    "Недільні служіння о 10:00 та 17:00 на 4 локаціях у Чернівцях і області, домашні групи, онлайн-трансляції та контакти.",
});

export default function Home() {
  const archivePreview = news.slice(0, 3);

  return (
    <Page active="/">
      <main>
        <section className="photo-hero photo-hero-mission" aria-label="Християнська церква Еммануїл">
          <div className="photo-hero-media">
            <img
              src="/media/hero-worship-organic-grain.webp?v=q2"
              width="1920"
              height="1080"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className="photo-hero-copy">
            <h1 className="sr-only">Християнська церква Еммануїл у Чернівцях</h1>
            <p className="hero-lead">Щонеділі о 10:00 та 17:00 · 4 локації</p>
            <div className="hero-actions">
              <a className="button button-wine" href="/visit">Вперше у нас</a>
              <a className="button button-ghost" href="/online">Дивитися онлайн</a>
            </div>
          </div>
        </section>

        <NextService />

        <section className="home-season" aria-labelledby="home-season-title">
          <div className="home-season-copy">
            <p className="overline">{groupSeason.label}</p>
            <h2 id="home-season-title">{groupSeason.title}</h2>
            <p className="home-season-period">{groupSeason.period} · {groups.length} груп</p>
            <p>{groupSeason.summary}</p>
            <div className="first-visit-actions">
              <a className="button button-wine" href={groupSeason.ctaHref}>{groupSeason.ctaLabel}</a>
              <a className="inline-link" href="/groups">Розклад груп</a>
            </div>
          </div>
          <figure className="home-season-media">
            <img src="/media/homegroup-how.webp?v=q2" width="1440" height="1440" alt="Домашні групи церкви Еммануїл" loading="lazy" decoding="async" />
          </figure>
        </section>

        <section className="home-live" aria-labelledby="home-live-title">
          <div className="home-live-copy">
            <p className="overline overline-light">Онлайн-служіння</p>
            <h2 id="home-live-title">Дивіться наживо</h2>
            <p>Щонеділі о 10:00 та 17:00. Під час ефіру плеєр увімкнеться тут автоматично.</p>
          </div>
          <div className="home-live-player">
            <LiveStream />
          </div>
        </section>

        <section className="first-visit-feature" aria-labelledby="home-expect-title">
          <div>
            <p className="overline">Вперше в Еммануїл</p>
            <h2 id="home-expect-title">Що очікувати</h2>
          </div>
          <div>
            <p>Служіння триває близько двох годин: поклоніння, проповідь і спілкування. Є дитяче служіння, відповіді про паркування, дресс-код і доступність — у практичному FAQ.</p>
            <div className="first-visit-actions">
              <a className="button button-wine" href="/visit#visit-faq">Практичний FAQ</a>
              <a className="inline-link" href="/contacts">Знайти на карті</a>
            </div>
          </div>
        </section>

        <section className="archive-preview news-section" aria-labelledby="home-archive-title">
          <div className="section-title">
            <p className="overline">Новини</p>
            <h2 id="home-archive-title">Архів подій</h2>
            <div className="section-description"><p>Останні публікації з життя церкви. Усі події в цьому розділі вже завершилися.</p></div>
          </div>
          <div className="news-list">
            {archivePreview.map((item) => (
              <article className="news-list-item" key={item.slug}>
                <a className="news-list-media" href={newsHref(item)} tabIndex={-1} aria-hidden="true">
                  <img src={item.image} alt="" loading="lazy" decoding="async" />
                </a>
                <div className="news-list-copy">
                  <div className="news-meta">
                    <time dateTime={item.publishedAt}>{item.date}</time>
                    <span>{item.category}</span>
                  </div>
                  <h3><a href={newsHref(item)}>{item.title}</a></h3>
                  <p className="news-summary">{item.summary}</p>
                  <a className="inline-link" href={newsHref(item)}>Читати</a>
                </div>
              </article>
            ))}
          </div>
          <a className="button button-secondary news-all-button" href="/news">Увесь архів новин</a>
        </section>

        <section className="donation-band">
          <div>
            <p className="overline overline-light">Пожертвування</p>
            <h2>Підтримати<br />церкву</h2>
          </div>
          <div>
            <p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p>
            <a className="button button-light" href="/donate">Реквізити</a>
          </div>
        </section>
      </main>
    </Page>
  );
}
