import { Page, PageHero, SectionTitle } from "../components/SiteShell";
import { news, site } from "../content";

export default function OnlinePage() {
  return (
    <Page active="/online">
      <main>
        <PageHero eyebrow="Онлайн" title={<>Залишайся<br /><em>на зв’язку.</em></>} text="Дивіться служіння та повертайтеся до важливих думок тоді, коли вам зручно. Ми поруч і онлайн." image={site.communityImage}>
          <a className="button button-wine" href="https://emmanuil.cv.ua/live">Перейти до трансляції</a>
        </PageHero>
        <section className="online-feature">
          <div className="online-image"><img src={site.heroImage} alt="Онлайн-служіння церкви" /><span className="large-play" aria-hidden="true">▶</span></div>
          <div><p className="overline">Дивіться зараз</p><h2>Слово, яке<br />можна почути<br /><em>знову.</em></h2><p>Проповіді, зустрічі та важливі розмови від Еммануїлу — для дому, дороги й тихого вечора.</p><a className="button button-secondary" href="https://emmanuil.cv.ua/live">Відкрити онлайн</a></div>
        </section>
        <section className="online-news-section">
          <SectionTitle kicker="Читайте" title={<>Останні<br /><em>новини.</em></>} />
          <div className="news-grid">{news.map((item) => <article className="news-card" key={item.title}><img src={item.image} alt="" /><time>{item.date}</time><h3>{item.title}</h3><a className="inline-link" href="https://emmanuil.cv.ua/news">Читати <span aria-hidden="true">→</span></a></article>)}</div>
        </section>
      </main>
    </Page>
  );
}
