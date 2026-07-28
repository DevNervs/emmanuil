import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";
import { ContactForm } from "../components/InteractionTools";
import { InteractiveMap } from "../components/InteractiveMap";
import { serviceLocations, site } from "../content";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/contacts",
  title: "Адреси церковних служінь у Чернівцях",
  description:
    "Адреси та карта церкви Еммануїл: Криворучка, Кобилянська, Садгора, Сторожинець. Телефони, маршрути Google Maps і контактна форма.",
  ogTitle: "Локації церкви Еммануїл у Чернівцях",
});

const locations = [
  ...serviceLocations.map((location) => ({ ...location, mapQuery: location.address })),
  { label: "Реабілітаційний центр", address: "с. Великий Кучурів, Чернівецька обл.", mapQuery: "Великий Кучурів, Чернівецький район, Чернівецька область, Україна", coordinates: "48.21543,25.910825", mapsUrl: "https://maps.app.goo.gl/C65CdZUqP8ChXojk8" },
];

export default function ContactsPage() {
  return (
    <Page active="/contacts">
      <main>
        <JsonLd data={breadcrumbFor("/contacts", "Локації та контакти")} />
        <PageIntro
          eyebrow="Чернівці та область"
          title={<>Локації<br />та контакти</>}
          text={<p>Тут зібрані адреси служінь, інтерактивна карта, телефони та форма зворотного звʼязку. Якщо ви вперше з нами — спочатку загляньте на сторінку першого візиту.</p>}
          image="/media/contacts-worship-hall.webp?v=q8"
          imageAlt="Молитва за Україну під час служіння в церкві Еммануїл"
          mediaClassName="page-intro-media-wide"
        >
          <div className="hero-actions">
            <a className="button button-wine" href="#contacts-map">Відкрити карту</a>
            <a className="button button-secondary" href="/visit">Вперше у нас</a>
          </div>
        </PageIntro>

        <InteractiveMap
          id="contacts-map"
          eyebrow="Місцезнаходження"
          title="Знайти нас на карті"
          description="Оберіть потрібну адресу в Чернівцях або Чернівецькій області. Для кожної точки можна одразу відкрити точний маршрут."
          locations={locations}
        />

        <section data-header-theme="light" className="contacts-layout">
          <div className="contact-block">
            <h2>Наші контакти</h2>
            <address>
              <strong>{site.address}</strong>
              <a href="tel:+380669509977">{site.phones[0]}</a>
              <a href="tel:+380969509977">{site.phones[1]}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </address>
            <address>
              <strong>{site.secondAddress}</strong>
            </address>
          </div>
          <div className="contact-block">
            <h2>Реабілітаційний центр</h2>
            <p>Якщо ви знаєте людей, які знаходяться в наркотичній, алкогольній чи ін. залежностях, звертайтеся:</p>
            <address>
              <strong>с. Великий Кучурів, Чернівецька обл.</strong>
              <a href="https://maps.app.goo.gl/C65CdZUqP8ChXojk8" target="_blank" rel="noreferrer">Відкрити на карті ↗</a>
              <a href="tel:+380989423713">(098) 942 37 13</a>
              <a href="tel:+380508476116">(050) 847 61 16</a>
              <a href="tel:+380372904032">(0372) 90 40 32</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </address>
          </div>
          <div className="contact-block">
            <h2>Соціальні мережі</h2>
            <div className="contact-socials">
              <SocialLink network="facebook" href={site.socials.facebook} />
              <SocialLink network="instagram" href={site.socials.instagram} />
              <SocialLink network="youtube" href={site.socials.youtube} />
              <SocialLink network="telegram" href={site.socials.telegram} />
              <SocialLink network="viber" href={site.socials.viber} />
            </div>
          </div>
        </section>

        <section data-header-theme="light" className="form-section">
          <div>
            <p className="overline">Написати нам</p>
            <h2>Контактна форма</h2>
          </div>
          <ContactForm email={site.email} />
        </section>
      </main>
    </Page>
  );
}
