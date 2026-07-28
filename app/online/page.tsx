import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { LiveStream } from "../components/LiveStream";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/online",
  title: "Онлайн-служіння церкви Еммануїл",
  description:
    "Дивіться недільні служіння церкви Еммануїл у Чернівцях онлайн о 10:00 та 17:00. Live-трансляція з YouTube.",
  ogTitle: "Онлайн-служіння Еммануїл",
});

export default function OnlinePage() {
  return (
    <Page active="/online">
      <main>
        <JsonLd data={breadcrumbFor("/online", "Онлайн")} />
        <PageIntro
          eyebrow="Приєднуйтеся звідусіль"
          title="Онлайн"
          text={
            <>
              <h2>Графік онлайн-трансляцій</h2>
              <p><strong>Щонеділі о 10:00 та 17:00</strong> — загальне служіння.</p>
              <p>Якщо відео не відображається або вам потрібна допомога, напишіть нам через сторінку контактів.</p>
            </>
          }
        />
        <section data-header-theme="light" className="video-section">
          <LiveStream />
        </section>
      </main>
    </Page>
  );
}
