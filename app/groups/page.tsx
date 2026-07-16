import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { groups } from "../content";

export const metadata: Metadata = { title: "Домашні групи — Еммануїл", description: "Розклад, ведучі та адреси домашніх груп церкви Еммануїл." };

export default function GroupsPage() {
  return <Page active="/groups"><main><PageIntro eyebrow="Щотижневі зустрічі" title="Домашні групи" text={<><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><p>Сезон домашніх груп розпочнеться <strong>5 травня.</strong></p></>} image="/media/homegroup-how.jpeg" imageAlt="Домашні групи церкви Еммануїл" /><section className="groups-page-section"><div className="group-page-grid">{groups.map(([title, leaders, time, address], index) => <article className="group-page-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{leaders}</p><strong>{time}</strong>{address ? <address>{address}</address> : null}</article>)}</div></section></main></Page>;
}
