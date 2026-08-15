import { Page, PageIntro } from "../components/SiteShell";
import { ServingRegistration } from "../components/ServingRegistration";
import { servings } from "../data/servings";
import { breadcrumbFor, pageMetadata } from "../seo";
import { JsonLd } from "../components/JsonLd";

export const metadata = pageMetadata({
  path: "/departments",
  title: "Департаменти та служіння церкви",
  description:
    "Департаменти та напрямки служіння церкви Еммануїл у Чернівцях: домашні групи, молоде, дитяче, музичне, медіа, євангелізація. Запишіться на служіння онлайн.",
});

export default function DepartmentsPage() {
  return (
    <Page active="/departments">
      <main>
        <JsonLd data={breadcrumbFor("/departments", "Департаменти та служіння")} />
        <PageIntro
          eyebrow="Департаменти"
          title={<>Служіння<br />та напрямки</>}
          text={<p>Церква — це спільнота, де кожен може служити своїм даром. Нижче зібрані напрямки служінь: оберіть близький вам і залиште заявку, а відповідальний служитель зв’яжеться з вами.</p>}
        >
          <div className="hero-actions">
            <a className="button button-wine" href="#serving-list">Записатися на служіння</a>
            <a className="button button-secondary" href="/contacts">Маю питання</a>
          </div>
        </PageIntro>

        <ServingRegistration servings={servings} />
      </main>
    </Page>
  );
}
