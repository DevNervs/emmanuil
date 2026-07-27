import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { site, visitFaq } from "../content";
import { breadcrumbFor, buildFaqPageSchema, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/visit",
  title: "Вперше у церкві Еммануїл — що очікувати",
  description:
    "Перший візит до церкви Еммануїл у Чернівцях: скільки триває служба, дитяче служіння, паркування, дресс-код, доступність і практичний FAQ.",
  ogTitle: "Вперше у церкві Еммануїл",
  ogDescription: "Практичні відповіді перед першим візитом до християнської церкви Еммануїл у Чернівцях.",
});

export default function VisitPage() {
  const faqSchema = buildFaqPageSchema();
  return (
    <Page active="/visit">
      <main>
        <JsonLd data={faqSchema} />
        <JsonLd data={breadcrumbFor("/visit", "Вперше у нас")} />
        <PageIntro
          eyebrow="Ласкаво просимо"
          title={<>Вперше<br />у нас</>}
          text={
            <>
              <h2>Будемо раді познайомитися</h2>
              <p>На служінні ми разом поклоняємося Богові, слухаємо Слово й молимося. Якщо ви завітаєте вперше, тут знайдете відповіді на основні запитання, адреси та маршрути до наших локацій.</p>
            </>
          }
          image="/media/visit-worship.webp?v=q2"
          imageAlt="Спільне поклоніння в церкві Еммануїл"
        >
          <div className="hero-actions">
            <a className="button button-wine" href="#visit-faq">Відповіді на запитання</a>
            <a className="button button-secondary" href="/contacts">Карта та локації</a>
          </div>
        </PageIntro>

        <section className="visit-steps" aria-labelledby="visit-expect-title">
          <div className="visit-steps-heading">
            <p className="overline">Ваш перший візит</p>
            <h2 id="visit-expect-title">Що вас чекає</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Теплий прийом</h3>
                <p>Вас зустрінуть біля входу, допоможуть знайти місце в залі та підкажуть, куди звернутися з питаннями.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Служіння разом</h3>
                <p>Ми співаємо, слухаємо Боже слово і молимося. Можна просто бути присутнім — нічого робити «правильно» не потрібно.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Спілкування після</h3>
                <p>Після служіння залишається час познайомитися та поспілкуватися за кавою, чаєм і частуваннями, поставити запитання або дізнатися про домашні групи.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="visit-faq" id="visit-faq" aria-labelledby="visit-faq-title">
          <div className="visit-faq-heading">
            <p className="overline">Перед візитом</p>
            <h2 id="visit-faq-title">Практичний FAQ</h2>
            <p>Скільки триває служба, чи є дитяче служіння, паркування, дресс-код, доступність і що робити, якщо ви вперше.</p>
          </div>
          <div className="visit-faq-list">
            {visitFaq.map((item, index) => (
              <details key={item.question} className="visit-faq-item" open={index === 0}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.question}</strong>
                </summary>
                <div className="visit-faq-panel">
                  <div className="visit-faq-panel-inner">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="visit-help">
          <div>
            <p className="overline">Готові прийти?</p>
            <h2>Оберіть локацію на карті</h2>
          </div>
          <div>
            <p>Адреси, час служінь, маршрути Google Maps і контактна форма зібрані на окремій сторінці. Якщо залишилися запитання — зателефонуйте або напишіть нам.</p>
            <div className="visit-help-links">
              <a className="button button-wine" href="/contacts">Локації та контакти</a>
              <a href={`tel:${site.phoneE164[0]}`}>{site.phones[0]}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </div>
        </section>
      </main>
    </Page>
  );
}
