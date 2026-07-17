import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";
import { ContactForm } from "../components/InteractionTools";
import { InteractiveMap } from "../components/InteractiveMap";
import { serviceLocations, site } from "../content";

export const metadata: Metadata = { title: "Адреси, локації та контакти", description: "Адреси служінь церкви Еммануїл у Чернівцях, Садгорі та Сторожинці, точні маршрути, телефони й соціальні мережі.", alternates: { canonical: "/contacts" } };

const locations = [
  ...serviceLocations.map((location) => ({ ...location, mapQuery: location.address })),
  { label: "Реабілітаційний центр", address: "с. Великий Кучурів, Чернівецька обл.", mapQuery: "Великий Кучурів, Чернівецький район, Чернівецька область, Україна", coordinates: "48.1993414,25.8942594" },
];

export default function ContactsPage() {
  return <Page active="/contacts"><main>
    <PageIntro eyebrow="Чернівці та область" title={<>Локації<br />та контакти</>} text={<p>Оберіть місце служіння, відкрийте маршрут або зв’яжіться з нами, якщо вам потрібна допомога перед візитом.</p>} image="/media/hope-family.webp" imageAlt="Надія для сімʼї"><a className="button button-wine" href="/visit">Вперше у нас</a></PageIntro>
    <InteractiveMap id="contacts-map" eyebrow="Місцезнаходження" title="Знайти нас на карті" description="Оберіть потрібну адресу в Чернівцях або Чернівецькій області. Для кожної точки можна одразу відкрити точний маршрут." locations={locations} />
    <section className="contacts-layout">
      <div className="contact-block"><h2>Наші контакти</h2><address><strong>{site.address}</strong><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a></address><address><strong>{site.secondAddress}</strong></address></div>
      <div className="contact-block"><h2>Реабілітаційний центр</h2><p>Якщо ви знаєте людей, які знаходяться в наркотичній, алкогольній чи ін. залежностях, звертайтеся:</p><address><strong>с. Великий Кучурів, Чернівецька обл.</strong><a href="tel:+380989423713">(098) 942 37 13</a><a href="tel:+380508476116">(050) 847 61 16</a><a href="tel:+380372904032">(0372) 90 40 32</a><a href={`mailto:${site.email}`}>{site.email}</a></address></div>
      <div className="contact-block"><h2>Соціальні мережі</h2><div className="contact-socials"><SocialLink network="facebook" href={site.socials.facebook} /><SocialLink network="instagram" href={site.socials.instagram} /><SocialLink network="youtube" href={site.socials.youtube} /><SocialLink network="telegram" href={site.socials.telegram} /><SocialLink network="viber" href={site.socials.viber} /></div></div>
    </section>
    <section className="form-section"><div><p className="overline">Написати нам</p><h2>Контактна форма</h2></div><ContactForm email={site.email} /></section>
  </main></Page>;
}
