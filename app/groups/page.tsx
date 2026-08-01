import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { GroupsExplorer } from "../components/GroupsExplorer";
import { groups } from "../content";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/groups",
  title: "Домашні групи в Чернівцях, Україна",
  description:
    "15 домашніх груп церкви Еммануїл у Чернівцях, Садгорі та Сторожинці: розклад, ведучі, адреси та онлайн-реєстрація.",
  ogTitle: "Домашні групи церкви Еммануїл",
});

export default function GroupsPage() {
  return (
    <Page active="/groups">
      <main>
        <JsonLd data={breadcrumbFor("/groups", "Домашні групи")} />
        <PageIntro
          eyebrow="Щотижневі зустрічі"
          title="Домашні групи"
          text={
            <>
              <p>
                <strong>Домашні групи</strong> — це щотижневі дружні зустрічі, де ми спілкуємось, вивчаємо Біблію,
                обговорюємо різноманітні теми, зміцнюючи дух для реалізації свого покликання.
              </p>
              <p>
                Оберіть групу з опублікованого переліку. Актуальність участі та деталі зустрічі підтвердить адміністратор
                після заявки.
              </p>
            </>
          }
          image="/media/homegroups/homegroup-gallery-01.webp?v=q2"
          imageAlt="Домашні групи церкви Еммануїл"
        />
        <GroupsExplorer groups={groups} />
      </main>
    </Page>
  );
}
