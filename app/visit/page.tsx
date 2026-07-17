import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { serviceLocations, site } from "../content";

export const metadata: Metadata = {
  title: "Вперше у церкві Еммануїл",
  description: "Оберіть одну з локацій церкви Еммануїл у Чернівцях і Сторожинці, перевірте час недільного служіння та побудуйте маршрут.",
  alternates: { canonical: "/visit" },
};

export default function VisitPage() {
  return <Page active="/visit"><main>
    <PageIntro eyebrow="Ласкаво просимо" title={<>Вперше<br />у нас</>} text={<><h2>Оберіть зручну локацію</h2><p>Перегляньте час недільного служіння та відкрийте маршрут. Якщо вам потрібно уточнити будь-які деталі перед візитом, зв’яжіться з нами.</p></>} image="/media/childrens.webp" imageAlt="Життя церкви Еммануїл"><div className="hero-actions"><a className="button button-wine" href="#visit-locations">Обрати локацію</a><a className="button button-secondary" href={`tel:+380669509977`}>Зателефонувати</a></div></PageIntro>

    <section className="visit-steps" aria-labelledby="visit-steps-title">
      <div className="visit-steps-heading"><p className="overline">Ваш перший візит</p><h2 id="visit-steps-title">Три прості кроки</h2></div>
      <ol><li><span>01</span><div><h3>Оберіть місце</h3><p>На сайті опубліковано чотири локації служінь у Чернівцях та Сторожинці.</p></div></li><li><span>02</span><div><h3>Перевірте час</h3><p>У кожної локації вказано чинний опублікований час недільного служіння.</p></div></li><li><span>03</span><div><h3>Відкрийте маршрут</h3><p>Кнопка маршруту відкриє точні координати вибраної локації в Google Maps.</p></div></li></ol>
    </section>

    <section className="visit-locations" id="visit-locations" aria-labelledby="visit-locations-title">
      <div className="visit-locations-heading"><p className="overline overline-light">Щонеділі</p><h2 id="visit-locations-title">Локації служінь</h2></div>
      <div className="visit-location-grid">{serviceLocations.map((location, index) => <article key={location.label}><span>{String(index + 1).padStart(2, "0")}</span><h3>{location.label}</h3><time>{location.time}</time><address>{location.address}</address><a className="button button-light" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.coordinates)}`} target="_blank" rel="noreferrer">Прокласти маршрут ↗</a></article>)}</div>
    </section>

    <section className="visit-help"><div><p className="overline">Потрібна підказка?</p><h2>Ми відповімо на запитання</h2></div><div><p>Інформація про паркування, дитяче служіння та доступність приміщення може відрізнятися залежно від локації. Будь ласка, уточніть потрібні деталі перед візитом.</p><div className="visit-help-links"><a href="tel:+380669509977">{site.phones[0]}</a><a href={`mailto:${site.email}`}>{site.email}</a><a className="button button-wine" href="/contacts">Усі контакти</a></div></div></section>
  </main></Page>;
}
