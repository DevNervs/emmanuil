import { Page } from "./components/SiteShell";
import { GroupsExplorer } from "./components/GroupsExplorer";
import { HomeGroupCount } from "./components/HomeGroupCount";
import { HeroLocations } from "./components/HeroLocations";
import { HeroVideo } from "./components/HeroVideo";
import { LiveOnlineButton } from "./components/LiveOnlineButton";
import { PromoSection } from "./components/PromoSection";
import { groupSeason, groups } from "./content";
import { pageMetadata } from "./seo";
import { handleYouTubeLive } from "../worker/youtubeLive";

export const metadata = pageMetadata({
  path: "/",
  title: { absolute: "Церква Еммануїл у Чернівцях, Україна | Християнська євангельська церква" },
  description:
    "Християнська євангельська церква Еммануїл у Чернівцях, Україна. Недільні служіння о 10:00 та 17:00 на 4 локаціях, домашні групи, онлайн-трансляції та контакти.",
  ogTitle: "Еммануїл — християнська церква у Чернівцях",
  ogDescription:
    "Недільні служіння о 10:00 та 17:00 на 4 локаціях у Чернівцях і області, домашні групи, онлайн-трансляції та контакти.",
});

const carouselPhotos = [
  "/media/homegroups/homegroup-gallery-01.webp",
  "/media/homegroups/homegroup-gallery-02.webp",
  "/media/homegroups/homegroup-gallery-03.webp",
  "/media/homegroups/homegroup-gallery-04.webp",
  "/media/homegroups/homegroup-gallery-05.webp",
  "/media/homegroups/homegroup-gallery-06.webp",
  "/media/homegroups/homegroup-gallery-07.webp",
  "/media/homegroups/homegroup-gallery-08.webp",
  "/media/homegroups/homegroup-gallery-09.webp",
  "/media/homegroups/homegroup-gallery-10.webp",
  "/media/homegroups/homegroup-gallery-11.webp",
  "/media/homegroups/homegroup-gallery-12.webp",
  "/media/homegroups/homegroup-gallery-13.webp",
  "/media/homegroups/homegroup-gallery-14.webp",
  "/media/homegroups/homegroup-gallery-15.webp",
];

export default async function Home() {
  const liveResponse = await handleYouTubeLive(new Request("https://example.com/api/youtube-live", { method: "GET" }));
  const liveResult = await liveResponse.json() as { live?: boolean; videoId?: string };
  const initialState = liveResult.live
    ? { status: "live" as const, videoId: liveResult.videoId }
    : { status: "offline" as const };

  return (
    <Page active="/">
      <main>
        <section data-header-theme="dark" className="video-hero" aria-label="Християнська церква Еммануїл">
          <div className="video-hero-media">
            <HeroVideo />
          </div>

          <div className="video-hero-overlay">
            {/* Slogan */}
            <div className="hero-center">
              <h1 className="sr-only">Християнська церква Еммануїл у Чернівцях</h1>
              <p className="hero-slogan">Існуємо, щоб ви дізналися про Бога більше</p>
              <div className="hero-actions">
                <a className="button button-wine" href="/visit/">Вперше у нас</a>
                <LiveOnlineButton initialState={initialState} />
              </div>
              <p className="hero-tagline">Поклоніння · учнівство · духовний зріст</p>
            </div>

            {/* 4 Locations Overlay Bar (Ecclesia style) */}
            <HeroLocations />
          </div>
        </section>

        <PromoSection />

        <section data-header-theme="light" className="first-visit-feature" aria-labelledby="home-intro-title">
          <div>
            <p className="overline">Про церкву</p>
            <h2 id="home-intro-title">Християнська церква Еммануїл у Чернівцях, Україна</h2>
          </div>
          <div>
            <p>
              Еммануїл — це євангельська церква в Україні та Європі, яка збирається в Чернівцях,
              Садгорі та Сторожинці, а також у Брюсселі, Амстердамі та Генті. Ми проводимо недільні
              служіння, дитяче служіння, домашні групи, молодіжні та сімейні зустрічі, а також
              онлайн-трансляції для тих, хто не може бути присутній.
            </p>
            <div className="first-visit-actions">
              <a className="button button-wine" href="/about/">Дізнатися більше</a>
              <a className="inline-link" href="/contacts/">Знайти адресу</a>
            </div>
          </div>
        </section>

        {/* Home Groups Section */}
        <section data-header-theme="light" className="home-season" aria-labelledby="home-season-title">
          <div className="home-season-copy">
            <p className="overline">{groupSeason.label}</p>
            <h2 id="home-season-title">{groupSeason.title}</h2>
            <p className="home-season-period">{groupSeason.period} · <HomeGroupCount fallback={groups.length} /></p>
            <p>{groupSeason.summary}</p>
            <div className="first-visit-actions">
              <GroupsExplorer groups={groups} launcherOnly />
              <a className="inline-link" href="/groups/">Розклад груп</a>
            </div>
          </div>

          <div className="home-season-media-wrapper">
            <figure className="home-season-media">
              <img
              src="/media/homegroup-how-home.webp?v=q4"
                width="1440"
                height="729"
                alt="Домашні групи церкви Еммануїл"
                loading="eager"
                fetchPriority="low"
                decoding="async"
              />
            </figure>

            {/* Continuous Marquee Auto-Scrolling Carousel constrained to media width */}
            <div className="groups-carousel-marquee" aria-label="Галерея домашніх груп">
              <div className="groups-carousel-track">
                {[...carouselPhotos, ...carouselPhotos].map((src, idx) => (
                  <div className="groups-carousel-slide" key={idx}>
                    <img
                      src={src}
                      width="1200"
                      height="900"
                      alt={`Фото з домашньої групи Еммануїл — ${(idx % carouselPhotos.length) + 1}`}
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section data-header-theme="light" className="first-visit-feature" aria-labelledby="home-expect-title">
          <div>
            <p className="overline">Вперше в Еммануїл</p>
            <h2 id="home-expect-title">Що очікувати</h2>
          </div>
          <div>
            <p>Служіння триває близько двох годин: поклоніння, проповідь і спілкування. Є дитяче служіння, відповіді про паркування, дресс-код і доступність — у практичному FAQ.</p>
            <div className="first-visit-actions">
              <a className="button button-wine" href="/visit#visit-faq">Практичний FAQ</a>
              <a className="inline-link" href="/contacts/">Знайти на карті</a>
            </div>
          </div>
        </section>

        <section data-header-theme="dark" className="donation-band">
          <div>
            <p className="overline overline-light">Пожертвування</p>
            <h2>Підтримати<br />служіння церкви</h2>
          </div>
          <div>
            <p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p>
            <a className="button button-light" href="/donate/">Реквізити</a>
          </div>
        </section>
      </main>
    </Page>
  );
}
