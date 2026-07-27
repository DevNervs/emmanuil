import { NextService } from "./components/NextService";
import { Page } from "./components/SiteShell";
import { announcement, groupSeason, groups } from "./content";
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
  return (
    <Page active="/">
      <main>
        <section className="video-hero" aria-label="Християнська церква Еммануїл">
          <div className="video-hero-media">
            <video
              src="/media/hero-worship-loop.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
          </div>
          <div className="video-hero-overlay">
            <p className="hero-schedule">Щонеділі о 10:00 та 17:00 · 4 локації</p>
            <div className="hero-center">
              <h1 className="sr-only">Християнська церква Еммануїл у Чернівцях</h1>
              <p className="hero-slogan">Існуємо, щоб ви дізналися про Бога більше</p>
              <div className="hero-actions">
                <a className="button button-wine" href="/visit">Вперше у нас</a>
                <a className="button button-ghost" href="/online">Дивитися онлайн</a>
              </div>
            </div>
            <p className="hero-tagline">Поклоніння · учнівство · духовний зріст</p>
          </div>
        </section>

        {announcement && (
          <section className="announcement-bar">
            {announcement.href ? (
              <a href={announcement.href}>{announcement.text}</a>
            ) : (
              <p>{announcement.text}</p>
            )}
          </section>
        )}

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

        <section className="groups-carousel" aria-label="Фото домашніх груп">
          <div className="groups-carousel-track">
            <div className="groups-carousel-slide">
              <img src="/media/homegroup-how.webp?v=q2" alt="Домашня група" loading="lazy" decoding="async" />
            </div>
            <div className="groups-carousel-slide">
              <img src="/media/home-group.webp?v=q2" alt="Домашня група" loading="lazy" decoding="async" />
            </div>
            <div className="groups-carousel-slide groups-carousel-placeholder"><span>Фото 3</span></div>
            <div className="groups-carousel-slide groups-carousel-placeholder"><span>Фото 4</span></div>
            <div className="groups-carousel-slide groups-carousel-placeholder"><span>Фото 5</span></div>
            <div className="groups-carousel-slide groups-carousel-placeholder"><span>Фото 6</span></div>
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
