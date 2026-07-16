import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { GroupsExplorer } from "../components/GroupsExplorer";
import { groups } from "../content";

export const metadata: Metadata = { title: "Домашні групи — Еммануїл", description: "Розклад, ведучі та адреси домашніх груп церкви Еммануїл.", alternates: { canonical: "/groups" } };

const preciseCoordinates: Record<string, string> = {
  "вул. О. Кобилянської 53, 1-й поверх, офіс": "48.2864175,25.9394979",
  "вул. О. Криворучки 57, 2-й поверх": "48.2786111,25.9200516",
  "вул. Скальда 31Г (вул. Комарова)": "48.2552907,25.9326718",
  "вул. Нагірна, 7Д": "48.2866216,25.9296352",
  "вул. О. Кобилянської 53, 2-й поверх, маленький кабінет": "48.2864175,25.9394979",
  "вул. Васіле Александрі, 8 (Баронський двір)": "48.3464098,25.9594925",
  "вул. Підкови 11-А": "48.3515346,25.9540737",
  "м. Сторожинець, вул. Українська 5": "48.1640400,25.7212200",
  "вул. О. Кобилянської 53, 2-й поверх, великий кабінет": "48.2864175,25.9394979",
  "с. Годилів, вул. Яремчука 3": "48.2442809,25.9332185",
};

const groupLocations = groups.map(([title, leaders, time, address]) => ({ title, leaders, time, address, coordinates: preciseCoordinates[address] }));

export default function GroupsPage() {
  return <Page active="/groups"><main><PageIntro eyebrow="Щотижневі зустрічі" title="Домашні групи" text={<><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><p>Сезон домашніх груп розпочнеться <strong>5 травня.</strong></p></>} image="/media/homegroup-how.jpeg" imageAlt="Домашні групи церкви Еммануїл" /><GroupsExplorer groups={groupLocations} /></main></Page>;
}
