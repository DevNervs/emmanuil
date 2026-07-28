import { Page } from "../components/SiteShell";
import { pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/europe",
  title: "Церкви в Європі",
  description: "Християнські церкви Еммануїл у містах Європи.",
});

export default function EuropePage() {
  return (
    <Page active="/europe">
      <main className="placeholder-page">
        <section data-header-theme="light" className="placeholder-content">
          <p className="overline">Церкви в Європі</p>
          <h1>Розділ в розробці</h1>
          <p>Інформація про церкви Еммануїл у містах Європи буде доступна найближчим часом.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-wine" href="/">На головну</a>
        </section>
      </main>
    </Page>
  );
}
