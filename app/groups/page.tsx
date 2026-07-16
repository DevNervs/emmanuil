import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { groups } from "../content";

export const metadata: Metadata = { title: "Домашні групи — Еммануїл", description: "Розклад, ведучі та адреси домашніх груп церкви Еммануїл." };

const mapUrl = (address: string) => `https://www.google.com/maps?q=${encodeURIComponent(`${address}, Чернівці, Україна`)}&output=embed`;

export default function GroupsPage() {
  return <Page active="/groups"><main><PageIntro eyebrow="Щотижневі зустрічі" title="Домашні групи" text={<><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><p>Сезон домашніх груп розпочнеться <strong>5 травня.</strong></p></>} image="/media/homegroup-how.jpeg" imageAlt="Домашні групи церкви Еммануїл" /><section className="groups-page-section"><div className="group-page-grid">{groups.map(([title, leaders, time, address], index) => <article className="group-page-card" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{leaders}</p><strong>{time}</strong>{address ? <><address>{address}</address><a className="map-link" href={mapUrl(address)} target="groups-map">Показати на карті <span aria-hidden="true">↗</span></a></> : null}</article>)}</div></section><section className="map-section map-section-dark"><div className="map-heading"><p className="overline overline-light">Місця зустрічей</p><h2>Домашні групи<br />на карті</h2><p>Оберіть «Показати на карті» у потрібній групі — карта автоматично відкриє її адресу.</p></div><div className="map-frame"><iframe name="groups-map" src={mapUrl("вул. О. Кобилянської, 53")} title="Карта домашніх груп церкви Еммануїл" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div></section></main></Page>;
}
