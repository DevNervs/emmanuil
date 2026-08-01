import type { Metadata } from "next";
import { Page } from "../components/SiteShell";
import { pageMetadata } from "../seo";

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/departments",
    title: "Департаменти церкви",
    description: "Департаменти та служіння церкви Еммануїл у Чернівцях.",
  }),
  robots: "noindex, nofollow",
};

export default function DepartmentsPage() {
  return (
    <Page active="/departments">
      <main className="placeholder-page">
        <section data-header-theme="light" className="placeholder-content">
          <p className="overline">Департаменти</p>
          <h1>Розділ в розробці</h1>
          <p>Інформація про департаменти та напрямки служіння церкви Еммануїл буде доступна найближчим часом.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-wine" href="/">На головну</a>
        </section>
      </main>
    </Page>
  );
}
