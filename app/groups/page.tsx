import { Page, PageHero, SectionTitle } from "../components/SiteShell";
import { groups, site } from "../content";

export default function GroupsPage() {
  return (
    <Page active="/groups">
      <main>
        <PageHero eyebrow="Домашні групи" title={<>Велика церква<br />починається з<br /><em>малого кола.</em></>} text="Домашня група — це простір, де можна бути почутим, молитися одне за одного, розбирати Біблію та будувати справжню дружбу." image={site.heroImage}>
          <a className="button button-wine" href="/contacts">Знайти свою групу</a>
        </PageHero>
        <section className="groups-page-section">
          <SectionTitle kicker="Спільноти" title={<>Обери коло,<br />де тобі <em>по дорозі.</em></>} text="Не потрібно все знати наперед. Просто зробіть перший крок — ми допоможемо знайти людей поруч." />
          <div className="group-page-grid">
            {groups.map((group, index) => <article className="group-page-card" key={group.title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{group.title}</h2><p>{group.text}</p><a className="inline-link" href="/contacts">Долучитися <span aria-hidden="true">→</span></a></article>)}
          </div>
        </section>
        <section className="groups-callout"><div><p className="overline overline-light">Перший крок</p><h2>Ще не знаєш,<br />куди <em>долучитись?</em></h2></div><p>Напиши нам кілька слів про себе — ми підкажемо, яка група може підійти саме тобі.</p><a className="button button-light" href="/contacts">Написати нам</a></section>
      </main>
    </Page>
  );
}
