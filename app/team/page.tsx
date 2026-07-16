import { Page, PageHero, SectionTitle } from "../components/SiteShell";
import { site, team } from "../content";

export default function TeamPage() {
  return (
    <Page active="/team">
      <main>
        <PageHero eyebrow="Наша команда" title={<>Люди, які<br />служать з <em>любов’ю.</em></>} text="Познайомтеся з людьми, які несуть відповідальність за служіння церкви та допомагають спільноті рости." image={site.communityImage} />
        <section className="team-page-section">
          <SectionTitle kicker="Служителі" title={<>Разом у<br /><em>служінні.</em></>} text="Ми різні за досвідом і дарами, але об’єднані одним бажанням — служити Богові та людям." />
          <div className="team-page-grid">
            {team.map((person) => <article className="team-person" key={person.name}><img src={person.image} alt={person.name} /><div><h2>{person.name}</h2><p>{person.role}</p><div className="person-links"><a href="/contacts" aria-label={`Написати ${person.name}`}>✉</a><a href="/contacts" aria-label={`Контакти ${person.name}`}>◌</a></div></div></article>)}
          </div>
        </section>
      </main>
    </Page>
  );
}
