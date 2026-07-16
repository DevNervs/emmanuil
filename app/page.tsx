import { Page, SectionTitle } from "./components/SiteShell";
import { news, newsHref, serviceLocations, team } from "./content";

export default function Home() {
  return (
    <Page active="/">
      <main>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <p className="overline">Чернівці · Україна</p>
            <h1>Християнська<br />церква<br /><em>Еммануїл</em></h1>
            <div className="hero-actions"><a className="button button-wine" href="/online">Дивитися онлайн</a><a className="button button-ghost" href="/contacts">Контакти</a></div>
          </div>
          <div className="hero-collage" aria-label="Життя церкви Еммануїл">
            <figure className="hero-photo-main"><img src="/media/baptism.jpg" alt="Водне хрещення церкви Еммануїл" fetchPriority="high" /></figure>
            <figure className="hero-photo-small"><img src="/media/childrens.jpg" alt="Свято для дітей" fetchPriority="high" /></figure>
            <div className="hero-caption"><span>Життя церкви</span><strong>Чернівці</strong></div>
          </div>
        </section>

        <section className="home-visit" aria-labelledby="home-services-title">
          <div className="home-visit-heading"><span>Щонеділі</span><h2 id="home-services-title">Локації служінь</h2></div>
          <div className="home-visit-grid">{serviceLocations.map((location, index) => <article key={location.label}><span>0{index + 1}</span><h3>{location.label}</h3><time>{location.time}</time><p>{location.address}</p><a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.coordinates)}`} target="_blank" rel="noreferrer" aria-label={`Прокласти маршрут: ${location.label}`}>Прокласти маршрут <i aria-hidden="true">↗</i></a></article>)}</div>
        </section>

        <section className="news-section">
          <SectionTitle kicker="Останнє" title="Новини" />
          <div className="news-grid">{news.slice(0, 3).map((item, index) => <article className={`news-card ${index === 0 ? "news-card-featured" : ""}`} key={item.slug}><a className="news-image" href={newsHref(item)}><img src={item.image} alt={item.title} loading="lazy" /></a><div className="news-meta"><time>{item.date}</time><span>0{index + 1}</span></div><h3><a href={newsHref(item)}>{item.title}</a></h3><a className="inline-link" href={newsHref(item)}>Читати новину</a></article>)}</div>
          <a className="button button-ghost news-all-button" href="/news">Усі новини</a>
        </section>

        <section className="home-groups-feature">
          <figure><img src="/media/homegroup-how.jpeg" alt="Домашні групи церкви Еммануїл" loading="lazy" /></figure>
          <div><p className="overline">Щотижневі зустрічі</p><h2>Домашні групи</h2><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><a className="button button-wine" href="/groups">Обрати групу</a></div>
        </section>

        <section className="team-preview">
          <div className="team-preview-title"><p className="overline overline-light">Служителі</p><h2>Команда церкви<br />Еммануїл</h2><a className="button button-light" href="/team">Уся команда</a></div>
          <div className="team-preview-grid">{team.slice(0, 3).map((person, index) => <article key={person.name}><div className="team-photo"><img src={person.image} alt={person.name} /><span>0{index + 1}</span></div><h3>{person.name}</h3><p>{person.role}</p></article>)}</div>
        </section>

        <section className="donation-band"><div><p className="overline overline-light">Пожертвування</p><h2>Підтримати<br />церкву</h2></div><div><p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p><a className="button button-light" href="/donate">Реквізити</a></div></section>
      </main>
    </Page>
  );
}
