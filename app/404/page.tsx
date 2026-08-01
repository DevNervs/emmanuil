import type { Metadata } from "next";
import { Page } from "../components/SiteShell";

export const metadata: Metadata = {
  title: "Сторінку не знайдено | Церква Еммануїл",
  description: "Сторінку не знайдено. Перейдіть до головної або скористайтеся навігацією.",
  robots: "noindex, nofollow",
};

export default function NotFoundPage() {
  return (
    <Page>
      <main className="placeholder-page">
        <section data-header-theme="light" className="placeholder-content">
          <p className="overline">404</p>
          <h1>Сторінку не знайдено</h1>
          <p>Ми не змогли знайти сторінку, яку ви шукаєте. Вона могла бути переміщена або видалена.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-wine" href="/">На головну</a>
        </section>
      </main>
    </Page>
  );
}
