import { Page, PageIntro, SectionTitle } from "./components/SiteShell";
import { news, site, team } from "./content";

export default function Home() {
  return (
    <Page active="/">
      <main>
        <PageIntro eyebrow="Чернівці" title={<>Християнська церква<br /><em>Еммануїл</em></>}>
          <div className="fact-row">
            <div><span>Загальні служіння</span><strong>{site.services}</strong></div>
            <div><span>Адреса</span><strong>{site.address}</strong></div>
          </div>
          <div className="hero-actions"><a className="button button-wine" href="/online">Дивитися онлайн</a><a className="button button-secondary" href="/contacts">Контакти</a></div>
        </PageIntro>

        <section className="home-links" aria-label="Основні розділи">
          <a href="/about"><span>01</span><strong>Ми віримо</strong><b>→</b></a>
          <a href="/team"><span>02</span><strong>Команда церкви Еммануїл</strong><b>→</b></a>
          <a href="/groups"><span>03</span><strong>Домашні групи</strong><b>→</b></a>
        </section>

        <section className="news-section">
          <SectionTitle title="Останні новини" />
          <div className="news-grid">{news.slice(0, 3).map((item) => <article className="news-card" key={item.href}><a href={item.href} target="_blank" rel="noreferrer"><img src={item.image} alt={item.title} /></a><time>{item.date}</time><h3>{item.title}</h3><a className="inline-link" href={item.href} target="_blank" rel="noreferrer">Читати на emmanuil.cv.ua <span aria-hidden="true">↗</span></a></article>)}</div>
          <a className="button button-secondary" href="/news">Усі новини</a>
        </section>

        <section className="team-preview">
          <SectionTitle title="Служителі церкви Еммануїл" />
          <div className="team-preview-grid">{team.slice(0, 3).map((person) => <article key={person.name}><img src={person.image} alt={person.name} /><h3>{person.name}</h3><p>{person.role}</p></article>)}</div>
          <a className="button button-secondary" href="/team">Уся команда</a>
        </section>

        <section className="donation-band"><div><p className="overline overline-light">Пожертвування</p><h2>Підтримати церкву</h2></div><p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p><a className="button button-light" href="/donate">Реквізити</a></section>
      </main>
    </Page>
  );
}
