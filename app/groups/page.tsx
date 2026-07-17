import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { GroupsExplorer } from "../components/GroupsExplorer";
import { groups } from "../content";

export const metadata: Metadata = { title: "Домашні групи", description: "Розклад, ведучі та адреси домашніх груп християнської церкви Еммануїл у Чернівцях і Чернівецькій області.", alternates: { canonical: "/groups" } };

export default function GroupsPage() {
  return <Page active="/groups"><main><PageIntro eyebrow="Щотижневі зустрічі" title="Домашні групи" text={<><p><strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію, обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.</p><p>Оберіть групу з опублікованого переліку. Актуальність участі та деталі зустрічі підтвердить адміністратор після заявки.</p></>} image="/media/homegroup-how.webp" imageAlt="Домашні групи церкви Еммануїл" /><GroupsExplorer groups={groups} /></main></Page>;
}
