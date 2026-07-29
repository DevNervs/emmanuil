import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { TeamGrid } from "../components/TeamGrid";
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
        <TeamGrid />
      </main>
    </Page>
  );
}
