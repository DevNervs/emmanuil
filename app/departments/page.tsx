import { Page } from "../components/SiteShell";
import { pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/departments",
  title: "Департаменти церкви",
  description: "Департаменти та служіння церкви Еммануїл у Чернівцях.",
});

export default function DepartmentsPage() {
  return (
    <Page active="/departments">
      <main className="placeholder-page">
        <section className="placeholder-content">
          <span className="placeholder-badge">Бета</span>
          <p className="overline">Департаменти</p>
          <h1>Розділ в розробці</h1>
          <p>Інформація про департаменти та напрямки служіння церкви Еммануїл буде доступна найближчим часом.</p>
          <a className="button button-wine" href="/">На головну</a>
        </section>
      </main>
    </Page>
  );
}
