import { Page, PageIntro } from "../components/SiteShell";
import { groups } from "../content";

export default function GroupsPage() {
  return <Page active="/groups"><main><PageIntro title="Домашні групи" text={<><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><p>Сезон домашніх груп розпочнеться <strong>5 травня.</strong></p></>} /><section className="groups-page-section"><div className="group-page-grid">{groups.map(([title, leaders, time, address]) => <article className="group-page-card" key={title}><h2>{title}</h2><p>{leaders}</p><strong>{time}</strong>{address ? <address>{address}</address> : null}</article>)}</div></section></main></Page>;
}
