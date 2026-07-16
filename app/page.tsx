import { news, site } from "./content";
import { Page, SectionTitle } from "./components/SiteShell";

export default function Home() {
  return (
    <Page active="/">
      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <img src={site.heroImage} alt="Люди на служінні церкви Еммануїл" />
          <div className="home-hero-overlay">
            <p className="overline overline-light">Чернівці · Україна</p>
            <h1 id="home-title">Церква,<br />де ти не <em>один.</em></h1>
            <p>Місце віри, щирих розмов і людей, які йдуть поруч.</p>
            <div className="hero-actions">
              <a className="button button-wine" href="/contacts">Я хочу завітати</a>
              <a className="button button-outline-light" href="/groups">Дізнатися більше <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        <section className="dashboard-grid" aria-label="Життя церкви">
          <article className="dashboard-card service-card">
            <div className="card-title"><span className="card-icon" aria-hidden="true">✦</span><h2>Найближче служіння</h2></div>
            <p className="service-date">Церква збирається щонеділі</p>
            <p className="service-copy">Молитва, поклоніння, Слово та час для спілкування після зустрічі.</p>
            <a className="inline-link" href="/contacts">Деталі зустрічі <span aria-hidden="true">→</span></a>
          </article>
          <article className="dashboard-card events-card">
            <div className="card-title"><span className="card-icon" aria-hidden="true">▦</span><h2>Події</h2></div>
            <div className="event-list">
              <a href="/groups"><span className="event-dot"></span><span><strong>Домашні групи</strong><small>ближче одне до одного</small></span><b aria-hidden="true">↗</b></a>
              <a href="/team"><span className="event-dot"></span><span><strong>Наша команда</strong><small>люди, які поруч</small></span><b aria-hidden="true">↗</b></a>
              <a href="/online"><span className="event-dot"></span><span><strong>Онлайн</strong><small>слухайте, де вам зручно</small></span><b aria-hidden="true">↗</b></a>
            </div>
          </article>
          <article className="dashboard-card sermon-card">
            <img src={site.communityImage} alt="Спільнота церкви" />
            <div className="sermon-shade"></div>
            <div className="sermon-copy"><span className="play-mark" aria-hidden="true">▶</span><p>Остання проповідь</p><h2>Надія, що тримає</h2><a href="/online">Дивитися <span aria-hidden="true">↗</span></a></div>
          </article>
          <article className="dashboard-card groups-card">
            <div className="card-title"><span className="card-icon" aria-hidden="true">◌</span><h2>Знайди свою спільноту</h2></div>
            <p>Маленькі кола для великих змін: підтримка, молитва і справжні розмови.</p>
            <a className="button button-soft" href="/groups">Обрати групу</a>
          </article>
        </section>

        <section className="values-band">
          <SectionTitle kicker="Наша основа" title={<>Віра, яка<br /><em>живе поруч.</em></>} text="Ми зростаємо не наодинці — у поклонінні, учнівстві та турботі одне про одного." />
          <div className="value-list">
            <article><span>01</span><h3>Поклоніння</h3><p>Пізнавати Бога та відповідати Йому всім життям.</p></article>
            <article><span>02</span><h3>Учнівство</h3><p>Вчитися жити вірою у щоденних рішеннях.</p></article>
            <article><span>03</span><h3>Духовний ріст</h3><p>Дорослішати в любові, надії та відповідальності.</p></article>
          </div>
        </section>

        <section className="news-section">
          <SectionTitle kicker="Новини" title={<>Життя громади<br />в <em>історіях.</em></>} />
          <div className="news-grid">
            {news.map((item) => <article className="news-card" key={item.title}><img src={item.image} alt="" /><time>{item.date}</time><h3>{item.title}</h3><a className="inline-link" href="/online">Читати <span aria-hidden="true">→</span></a></article>)}
          </div>
          <a className="button button-secondary" href="/online">Усі новини</a>
        </section>

        <section className="support-banner">
          <div><p className="overline overline-light">Пожертвування</p><h2>Ми поширюємо<br />Царство Бога <em>разом.</em></h2></div>
          <div><p>Дякуємо кожному, хто підтримує нас молитвою й фінансами у розповсюдженні Божого слова.</p><a className="button button-light" href="/donate">Підтримати церкву</a></div>
        </section>
      </main>
    </Page>
  );
}
