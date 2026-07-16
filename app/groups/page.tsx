import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { InteractiveMap } from "../components/InteractiveMap";
import { groups } from "../content";

export const metadata: Metadata = { title: "Домашні групи — Еммануїл", description: "Розклад, ведучі та адреси домашніх груп церкви Еммануїл." };

const groupLocations = groups.filter((group) => group[3]).map(([title, , , address]) => ({ label: title, address: /^(м\.|с\.)/.test(address) ? `${address}, Україна` : `${address}, Чернівці, Україна` }));

export default function GroupsPage() {
  return <Page active="/groups"><main><PageIntro eyebrow="Щотижневі зустрічі" title="Домашні групи" text={<><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><p>Сезон домашніх груп розпочнеться <strong>5 травня.</strong></p></>} image="/media/homegroup-how.jpeg" imageAlt="Домашні групи церкви Еммануїл" /><InteractiveMap id="groups-map" eyebrow="Місця зустрічей" title="Домашні групи на карті" description="Оберіть потрібну домашню групу — адреса та точка на карті зміняться одразу, без переходу на іншу сторінку." locations={groupLocations} dark /><section className="groups-page-section"><div className="group-page-grid">{groups.map(([title, leaders, time, address], index) => <article className="group-page-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{leaders}</p><strong>{time}</strong>{address ? <><address>{address}</address><a className="map-link" href="#groups-map">Переглянути інтерактивну карту <span aria-hidden="true">↓</span></a></> : null}</article>)}</div></section></main></Page>;
}
