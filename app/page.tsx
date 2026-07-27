import { Page } from "./components/SiteShell";
import { announcement, groupSeason, groups, serviceLocations } from "./content";
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

const carouselPhotos = [
  "/media/homegroup-how.webp?v=q2",
  "/media/home-group.webp?v=q2",
  "/media/about-community.webp",
  "/media/contacts-church-hall.webp",
  "/media/jatva-2024.webp",
  "/media/visit-worship.webp",
];

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
            <div className="video-grain-overlay" aria-hidden="true" />
          </div>

          <div className="video-hero-overlay">
            {/* Slogan */}
            <div className="hero-center">
              <h1 className="sr-only">Християнська церква Еммануїл у Чернівцях</h1>
              <p className="hero-slogan">Існуємо, щоб ви дізналися про Бога більше</p>
              <div className="hero-actions">
                <a className="button button-wine" href="/visit">Вперше у нас</a>
                <a className="button button-ghost" href="/online">Дивитися онлайн</a>
              </div>
              <p className="hero-tagline">Поклоніння · учнівство · духовний зріст</p>
            </div>

            {/* 4 Locations Overlay Bar (Ecclesia style) */}
            <div className="hero-locations-bar">
              <div className="hero-locations-header">
                <span className="hero-locations-title">Найближчі служіння</span>
                <a className="hero-locations-link" href="/contacts">
                  Карта та маршрути →
                </a>
              </div>
              <div className="hero-locations-grid">
                {serviceLocations.map((loc) => (
                  <a key={loc.label} className="hero-location-card" href="/contacts">
                    <strong>{loc.streetAddress}</strong>
                    <time>{loc.time}</time>
                  </a>
                ))}
              </div>
            </div>
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

        {/* Home Groups Section */}
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

          <div className="home-season-media-wrapper">
            <figure className="home-season-media">
              <img
                src="/media/homegroup-how.webp?v=q2"
                width="1440"
                height="1440"
                alt="Домашні групи церкви Еммануїл"
                loading="lazy"
                decoding="async"
              />
            </figure>

            {/* Continuous Marquee Auto-Scrolling Carousel constrained to media width */}
            <div className="groups-carousel-marquee" aria-label="Галерея домашніх груп">
              <div className="groups-carousel-track">
                {[...carouselPhotos, ...carouselPhotos].map((src, idx) => (
                  <div className="groups-carousel-slide" key={idx}>
                    <img src={src} alt="Домашня група Еммануїл" loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            </div>
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
