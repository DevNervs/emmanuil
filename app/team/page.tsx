import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";
import { team } from "../content";

export const metadata: Metadata = { title: "Команда — Еммануїл", description: "Служителі християнської церкви Еммануїл у Чернівцях.", alternates: { canonical: "/team" } };

export default function TeamPage() {
  return <Page active="/team"><main><PageIntro eyebrow="Служителі" title={<>Команда церкви<br />Еммануїл</>} image="/media/childrens.webp" imageAlt="Подія церкви Еммануїл" /><section className="team-page-section"><div className="team-page-grid">{team.map((person, index) => <article className="team-person" key={person.name}><div className="team-person-image"><img src={person.image} width="300" height="300" alt={person.name} loading="lazy" decoding="async" /><span>0{index + 1}</span></div><div><h2>{person.name}</h2><p>{person.role}</p><div className="person-links">{person.facebook ? <SocialLink network="facebook" href={person.facebook} label={`${person.name} — Facebook`} /> : null}{person.instagram ? <SocialLink network="instagram" href={person.instagram} label={`${person.name} — Instagram`} /> : null}</div></div></article>)}</div></section></main></Page>;
}
