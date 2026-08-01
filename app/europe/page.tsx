import type { Metadata } from "next";
import { Clock, MapPin } from "lucide-react";
import { Page, PageIntro } from "../components/SiteShell";
import { InteractiveMap } from "../components/InteractiveMap";
import { JsonLd } from "../components/JsonLd";
import { SocialLink } from "../components/SocialLink";
import { europeLocations } from "../data/europe";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/europe",
    title: "Церкви Еммануїл у Європі",
    description:
      "Християнські церкви Еммануїл у Брюсселі, Амстердамі та Генті. Адреси, розклад недільних служінь, молитов і молодіжних зустрічей.",
    ogTitle: "Церкви Еммануїл у Європі",
  }),
};

export default function EuropePage() {
  const mapLocations = europeLocations.map((loc) => ({
    label: `${loc.flag} ${loc.city}`,
    address: loc.address,
    mapQuery: loc.mapQuery,
    mapsUrl: loc.mapsUrl,
  }));

  return (
    <Page active="/europe">
      <main>
        <JsonLd data={breadcrumbFor("/europe", "Європа")} />
        <PageIntro
          eyebrow="Міжнародне служіння"
          title={<>Церкви<br />в Європі</>}
          text={
            <>
              <h2>Брюссель · Амстердам · Гент</h2>
              <p>
                Недільні зібрання, молитовні зустрічі та молодіжні групи
                українською мовою для українців у Європі. Оберіть ближчу
                локацію і приєднуйтесь.
              </p>
            </>
          }
          image="/media/europe-hero.jpg?v=q1"
          imageAlt="Спільне поклоніння в церкві Еммануїл"
          mediaClassName="europe-intro-media"
        >
          <div className="hero-actions">
            <a className="button button-wine" href="#europe-map">
              Знайти на карті
            </a>
            <a className="button button-secondary" href="#europe-locations">
              Розклад
            </a>
          </div>
        </PageIntro>

        <InteractiveMap
          id="europe-map"
          eyebrow="Локації"
          title="Оберіть місто"
          description="Церкви Еммануїл у Брюсселі, Амстердамі та Генті. Оберіть адресу, щоб побудувати маршрут у Google Maps."
          locations={mapLocations}
        />

        <section
          id="europe-locations"
          data-header-theme="light"
          className="europe-locations-section"
          aria-labelledby="europe-locations-title"
        >
          <div className="europe-locations-header">
            <p className="overline">Розклад зібрань</p>
            <h2 id="europe-locations-title">
              Служіння в європейських містах
            </h2>
          </div>
          <div className="europe-locations-grid">
            {europeLocations.map((loc) => (
              <article key={loc.city} className="europe-location-card">
                <div className="europe-location-heading">
                  <span className="europe-location-flag" aria-hidden="true">
                    {loc.flag}
                  </span>
                  <div>
                    <h3>{loc.city}</h3>
                    <p className="europe-location-country">{loc.country}</p>
                  </div>
                </div>
                <address className="europe-location-address">
                  <MapPin size={16} aria-hidden="true" />
                  <span>{loc.address}</span>
                </address>
                <ul className="europe-location-schedule">
                  {loc.schedule.map((item) => (
                    <li key={`${item.day}-${item.time}`}>
                      <Clock size={16} aria-hidden="true" />
                      <div>
                        <strong>
                          {item.day} о {item.time}
                        </strong>
                        <span>{item.label}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <a
                  className="button button-wine"
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Маршрут у Google Maps <span aria-hidden="true">↗</span>
                </a>
                <div className="europe-location-socials">
                  <SocialLink
                    network="instagram"
                    href={loc.instagram}
                    label={`Instagram: ${loc.city}`}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          data-header-theme="light"
          className="europe-social-section"
          aria-labelledby="europe-social-title"
        >
          <div className="europe-social-header">
            <p className="overline">Соціальні мережі</p>
            <h2 id="europe-social-title">Слідкуйте за європейськими церквами</h2>
          </div>
          <div className="europe-social-grid">
            {europeLocations.map((loc) => (
              <a
                key={loc.city}
                className="europe-social-card"
                href={loc.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="europe-location-flag" aria-hidden="true">
                  {loc.flag}
                </span>
                <strong>{loc.city}</strong>
                <span className="europe-social-handle">
                  @{loc.instagram.replace(/.*\//, "").replace(/\/$/, "")}
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </Page>
  );
}
