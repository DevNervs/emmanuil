import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";
import { team } from "../content";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/team",
  title: "Пастори та команда церкви",
  description: "Пастори, диякони та служителі християнської церкви Еммануїл у Чернівцях.",
});

export default function TeamPage() {
  return (
    <Page active="/team">
      <main>
        <JsonLd data={breadcrumbFor("/team", "Команда")} />
        <PageIntro
          eyebrow="Служителі"
          title={
            <>
              Команда церкви
              <br />
              Еммануїл
            </>
          }
          image="/media/team-ministry.webp?v=q3"
          imageAlt="Служитель церкви Еммануїл звертається до громади"
        />
        <section data-header-theme="light" className="team-page-section">
          <div className="team-page-grid">
            {team.map((person, index) => (
              <article className="team-person" key={person.name}>
                <div className="team-person-image">
                  <img src={person.image} width="735" height="1024" alt={person.name} loading="lazy" decoding="async" />
                  <span>0{index + 1}</span>
                </div>
                <div>
                  <h2>{person.name}</h2>
                  <p>{person.role}</p>
                  <div className="person-links">
                    {person.facebook ? (
                      <SocialLink network="facebook" href={person.facebook} label={`${person.name} — Facebook`} />
                    ) : null}
                    {person.instagram ? (
                      <SocialLink network="instagram" href={person.instagram} label={`${person.name} — Instagram`} />
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Page>
  );
}
