import { Page, PageHero, SectionTitle } from "../components/SiteShell";
import { site } from "../content";

export default function ContactsPage() {
  return (
    <Page active="/contacts">
      <main>
        <PageHero eyebrow="Контакти" title={<>Давайте<br /><em>познайомимось.</em></>} text="Маєте запитання, хочете завітати або знайти домашню групу? Напишіть чи зателефонуйте — будемо раді зустрічі." image={site.aboutImage} />
        <section className="contacts-layout">
          <div><SectionTitle kicker="Ми поруч" title={<>Знайдіть нас<br />у <em>Чернівцях.</em></>} /><a className="map-card" href="https://maps.google.com/?q=48.2861034,25.9393799"><span>▦</span><strong>{site.address}</strong><small>Відкрити маршрут ↗</small></a></div>
          <div className="contact-details">
            <article><span>Телефон</span><a href="tel:+380506021866">{site.phone}</a></article>
            <article><span>Пошта</span><a href="mailto:emmanuil.cv@gmail.com">{site.email}</a></article>
            <article><span>Соціальні мережі</span><div><a href="https://www.facebook.com">Facebook</a><a href="https://www.instagram.com">Instagram</a><a href="https://www.youtube.com">YouTube</a></div></article>
          </div>
        </section>
      </main>
    </Page>
  );
}
