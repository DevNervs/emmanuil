"use client";

import { SocialLink } from "./SocialLink";
import { useSiteConfig } from "./SiteConfig";

export function TeamGrid() {
  const { config } = useSiteConfig();
  const team = config.team ?? [];

  return (
    <section data-header-theme="light" className="team-page-section">
      <div className="team-page-grid">
        {team.map((person, index) => (
          <article className="team-person" key={person.id ?? person.name}>
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
  );
}
