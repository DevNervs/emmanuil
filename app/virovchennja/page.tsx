import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/virovchennja",
  title: "Основи віровчення УЦХВЄ",
  description:
    "Офіційний документ основ віровчення Української Церкви Християн Віри Євангельської — PDF для ознайомлення та завантаження.",
});

export default function VirobchennjaPage() {
  return (
    <Page active="/about">
      <main>
        <JsonLd data={breadcrumbFor("/virovchennja", "Основи віровчення")} />
        <PageIntro
          eyebrow="УЦХВЄ"
          title={
            <>
              Основи
              <br />
              віровчення
            </>
          }
          text={
            <>
              <p>
                Офіційний документ основ віровчення Української Церкви Християн Віри Євангельської, до якої належить церква
                Еммануїл.
              </p>
              <div className="first-visit-actions">
                <a className="button button-wine" href="/media/osnovy_viry.pdf" download="osnovy_viry.pdf">
                  Завантажити PDF
                </a>
                <a className="inline-link" href="/about#beliefs">
                  У що ми віримо
                </a>
              </div>
            </>
          }
        />
        <section data-header-theme="light" className="doctrine-document" aria-label="PDF основ віровчення УЦХВЄ">
          <iframe
            className="doctrine-pdf"
            src="/media/osnovy_viry.pdf#view=FitH"
            title="Основи віровчення УЦХВЄ — PDF"
            loading="lazy"
          />
          <p className="doctrine-fallback">
            Якщо документ не відкривається в браузері, <a href="/media/osnovy_viry.pdf" download="osnovy_viry.pdf">завантажте PDF</a>.
          </p>
        </section>
      </main>
    </Page>
  );
}
