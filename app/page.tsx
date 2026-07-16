import type { Metadata } from "next";
import { Page, SectionTitle } from "./components/SiteShell";
import { LiveStream } from "./components/LiveStream";
import { news, newsHref, serviceLocations, team } from "./content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <Page active="/">
      <main>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <p className="overline">Чернівці · Україна</p>
            <h1>Християнська<br />церква<br /><em>Еммануїл</em></h1>
            <div className="hero-actions"><a className="button button-wine" href="/visit">Вперше у нас</a><a className="button button-ghost" href="/online">Дивитися онлайн</a></div>
          </div>
          <div className="hero-collage" aria-label="Життя церкви Еммануїл">
            <figure className="hero-photo-main"><img src="/media/baptism.webp" width="1080" height="1080" alt="Водне хрещення церкви Еммануїл" fetchPriority="high" decoding="async" /></figure>
            <figure className="hero-photo-small"><img src="/media/childrens.webp" width="1080" height="1080" alt="Свято для дітей" fetchPriority="high" decoding="async" /></figure>
            <div className="hero-caption"><span>Життя церкви</span><strong>Чернівці</strong></div>
          </div>
        </section>

        <section className="home-visit" aria-labelledby="home-services-title">
          <div className="home-visit-heading"><span>Щонеділі</span><h2 id="home-services-title">Локації служінь</h2></div>
          <div className="home-visit-grid">{serviceLocations.map((location, index) => <article key={location.label}><span>0{index + 1}</span><h3>{location.label}</h3><time>{location.time}</time><p>{location.address}</p><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.coordinates)}`} target="_blank" rel="noreferrer" aria-label={`Прокласти маршрут: ${location.label}`}>Прокласти маршрут <i aria-hidden="true">↗</i></a></article>)}</div>
        </section>

        <section className="first-visit-feature">
          <div><p className="overline">Вперше в Еммануїл</p><h2>Зробіть перший крок спокійно</h2></div>
          <div><p>Оберіть зручну локацію, перегляньте час служіння та відкрийте маршрут. Якщо вам потрібна додаткова інформація перед візитом, зателефонуйте або напишіть нам.</p><div className="first-visit-actions"><a className="button button-wine" href="/visit">Спланувати візит</a><a className="inline-link" href="/contacts">Поставити запитання</a></div></div>
        </section>

        <section className="home-groups-feature">
          <figure><img src="/media/homegroup-how.webp" width="1440" height="1440" alt="Домашні групи церкви Еммануїл" loading="lazy" decoding="async" /></figure>
          <div><p className="overline">Щотижневі зустрічі</p><h2>Домашні групи</h2><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><a className="button button-wine" href="/groups">Обрати групу</a></div>
        </section>

        <section className="home-online-section">
          <div className="home-online-heading"><p className="overline overline-light">Трансляція</p><h2>Приєднуйтеся онлайн</h2><p>Загальні служіння транслюються щонеділі о 10:00 та 17:00. Якщо ефір ще не розпочався, відкрийте YouTube-канал церкви.</p><a className="button button-light" href="/online">Сторінка трансляції</a></div>
          <LiveStream />
        </section>

        <section className="team-preview">
          <div className="team-preview-title"><p className="overline overline-light">Про церкву</p><h2>Спільнота для духовного зростання</h2><p className="team-preview-copy">Ми прагнемо зростати у поклонінні, учнівстві та духовному житті разом.</p><div className="team-preview-actions"><a className="button button-light" href="/about">Про церкву</a><a className="inline-link inline-link-light" href="/team">Уся команда</a></div></div>
          <div className="team-preview-grid">{team.slice(0, 3).map((person, index) => <article key={person.name}><div className="team-photo"><img src={person.image} width="300" height="300" alt={person.name} loading="lazy" decoding="async" /><span>0{index + 1}</span></div><h3>{person.name}</h3><p>{person.role}</p></article>)}</div>
        </section>

        <section className="news-section archive-preview">
          <SectionTitle kicker="З життя церкви · Архів" title="Історії та події" text={<p>Опубліковані матеріали збережені як архів життя церкви. Події в цьому розділі вже завершилися.</p>} />
          <div className="news-grid">{news.slice(0, 3).map((item, index) => <article className={`news-card ${index === 0 ? "news-card-featured" : ""}`} key={item.slug}><a className="news-image" href={newsHref(item)}><img src={item.image} alt={item.title} loading="lazy" decoding="async" /></a><div className="news-meta"><time dateTime={item.publishedAt}>{item.date}</time><span>{item.category}</span></div><span className="archive-badge">Подія завершена</span><h3><a href={newsHref(item)}>{item.title}</a></h3><p className="news-summary">{item.summary}</p><a className="inline-link" href={newsHref(item)}>Переглянути архів</a></article>)}</div>
          <a className="button button-ghost news-all-button" href="/news">Увесь архів</a>
        </section>

        <section className="donation-band"><div><p className="overline overline-light">Пожертвування</p><h2>Підтримати<br />церкву</h2></div><div><p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p><a className="button button-light" href="/donate">Реквізити</a></div></section>
      </main>
    </Page>
  );
}
