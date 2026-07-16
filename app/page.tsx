import { Page, SectionTitle } from "./components/SiteShell";
import { news, site, team } from "./content";

export default function Home() {
  return (
    <Page active="/">
      <main>
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <p className="overline">Чернівці · Україна</p>
            <h1>Християнська<br />церква<br /><em>Еммануїл</em></h1>
            <div className="hero-actions"><a className="button button-wine" href="/online">Дивитися онлайн</a><a className="button button-ghost" href="/contacts">Контакти <span aria-hidden="true">↗</span></a></div>
            <div className="hero-details"><div><span>Загальні служіння</span><strong>{site.services}</strong></div><div><span>Адреса</span><strong>{site.address}</strong></div></div>
          </div>
          <div className="hero-collage" aria-label="Життя церкви Еммануїл">
            <figure className="hero-photo-main"><img src="/media/baptism.jpg" alt="Водне хрещення церкви Еммануїл" fetchPriority="high" /></figure>
            <figure className="hero-photo-small"><img src="/media/childrens.jpg" alt="Свято для дітей" fetchPriority="high" /></figure>
            <div className="hero-caption"><span>Життя церкви</span><strong>Чернівці</strong></div>
          </div>
        </section>

        <section className="fact-ribbon">
          <a href="/about"><span>01</span><strong>Ми віримо</strong><b aria-hidden="true">↗</b></a>
          <a href="/groups"><span>02</span><strong>Домашні групи</strong><b aria-hidden="true">↗</b></a>
          <a href="/online"><span>03</span><strong>Пряма трансляція</strong><b aria-hidden="true">↗</b></a>
        </section>

        <section className="home-links" aria-label="Основні розділи">
          <div className="home-links-heading"><p className="overline">Розділи</p><h2>Церква<br />Еммануїл</h2></div>
          <div className="home-links-list">
            <a href="/about"><span>01</span><strong>Ми віримо</strong><b>↗</b></a>
            <a href="/team"><span>02</span><strong>Команда церкви</strong><b>↗</b></a>
            <a href="/groups"><span>03</span><strong>Домашні групи</strong><b>↗</b></a>
          </div>
        </section>

        <section className="news-section">
          <SectionTitle kicker="Останнє" title="Новини" />
          <div className="news-grid">{news.slice(0, 3).map((item, index) => <article className={`news-card ${index === 0 ? "news-card-featured" : ""}`} key={item.href}><a className="news-image" href={item.href} target="_blank" rel="noreferrer"><img src={item.image} alt={item.title} loading="lazy" /><span aria-hidden="true">↗</span></a><div className="news-meta"><time>{item.date}</time><span>0{index + 1}</span></div><h3>{item.title}</h3><a className="inline-link" href={item.href} target="_blank" rel="noreferrer">Читати новину</a></article>)}</div>
          <a className="text-arrow" href="/news">Усі новини <span aria-hidden="true">→</span></a>
        </section>

        <section className="team-preview">
          <div className="team-preview-title"><p className="overline overline-light">Служителі</p><h2>Команда церкви<br />Еммануїл</h2><a className="button button-light" href="/team">Уся команда</a></div>
          <div className="team-preview-grid">{team.slice(0, 3).map((person, index) => <article key={person.name}><div className="team-photo"><img src={person.image} alt={person.name} /><span>0{index + 1}</span></div><h3>{person.name}</h3><p>{person.role}</p></article>)}</div>
        </section>

        <section className="donation-band"><div><p className="overline overline-light">Пожертвування</p><h2>Підтримати<br />церкву</h2></div><div><p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p><a className="button button-light" href="/donate">Реквізити <span aria-hidden="true">→</span></a></div></section>
      </main>
    </Page>
  );
}
