import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";
import { ContactForm } from "../components/InteractionTools";
import { InteractiveMap } from "../components/InteractiveMap";
import { site } from "../content";

export const metadata: Metadata = { title: "Контакти — Еммануїл", description: "Адреси, телефони, електронна пошта та соціальні мережі церкви Еммануїл у Чернівцях.", alternates: { canonical: "/contacts" } };

const locations = [
  { label: "Церква Еммануїл", address: "вул. О. Кобилянської, 53, Чернівці", mapQuery: "вулиця Ольги Кобилянської, 53, Чернівці, Чернівецький район, Чернівецька область, 58002, Україна", coordinates: "48.2864175,25.9394979" },
  { label: "Криворучка", address: "вул. Ореста Криворучка, 57, Чернівці", mapQuery: "вулиця Ореста Криворучка, 57, Чернівці, Чернівецький район, Чернівецька область, 58010, Україна", coordinates: "48.2786111,25.9200516" },
  { label: "Садгора — Баронський двір", address: "вул. Васіле Александрі, 8, Чернівці", mapQuery: "вулиця Васіле Александрі, 8, Чернівці, Чернівецький район, Чернівецька область, Україна", coordinates: "48.3464098,25.9594925" },
  { label: "Сторожинець", address: "вул. Українська, 5, Сторожинець", mapQuery: "вулиця Українська, 5, Сторожинець, Чернівецький район, Чернівецька область, 59000, Україна", coordinates: "48.1640400,25.7212200" },
  { label: "Реабілітаційний центр", address: "с. Великий Кучурів, Чернівецька обл.", mapQuery: "Великий Кучурів, Чернівецький район, Чернівецька область, Україна", coordinates: "48.1993414,25.8942594" },
];

export default function ContactsPage() {
  return <Page active="/contacts"><main>
    <PageIntro eyebrow="Чернівці" title="Контакти" image="/media/hope-family.jpg" imageAlt="Надія для сімʼї" />
    <InteractiveMap id="contacts-map" eyebrow="Місцезнаходження" title="Знайти нас на карті" description="Оберіть потрібну адресу в Чернівцях або Чернівецькій області. Для кожної точки можна одразу відкрити точний маршрут." locations={locations} />
    <section className="contacts-layout">
      <div className="contact-block"><h2>Наші контакти</h2><address><strong>{site.address}</strong><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a></address><address><strong>{site.secondAddress}</strong></address></div>
      <div className="contact-block"><h2>Реабілітаційний центр</h2><p>Якщо ви знаєте людей, які знаходяться в наркотичній, алкогольній чи ін. залежностях, звертайтеся:</p><address><strong>с. Великий Кучурів, Чернівецька обл.</strong><a href="tel:+380989423713">(098) 942 37 13</a><a href="tel:+380508476116">(050) 847 61 16</a><a href="tel:+380372904032">(0372) 90 40 32</a><a href={`mailto:${site.email}`}>{site.email}</a></address></div>
      <div className="contact-block"><h2>Соціальні мережі</h2><div className="contact-socials"><SocialLink network="facebook" href={site.socials.facebook} /><SocialLink network="instagram" href={site.socials.instagram} /><SocialLink network="youtube" href={site.socials.youtube} /><SocialLink network="telegram" href={site.socials.telegram} /><SocialLink network="viber" href={site.socials.viber} /></div></div>
    </section>
    <section className="form-section"><div><p className="overline">Написати нам</p><h2>Контактна форма</h2></div><ContactForm email={site.email} /></section>
  </main></Page>;
}
