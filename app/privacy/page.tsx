import { JsonLd } from "../components/JsonLd";
import { Page, PageIntro } from "../components/SiteShell";
import { site } from "../content";
import { breadcrumbFor, pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/privacy",
  title: "Політика конфіденційності",
  description: "Як сайт церкви Еммануїл обробляє дані з контактної форми та заявки на домашню групу.",
});

export default function PrivacyPage() {
  return (
    <Page>
      <main>
        <JsonLd data={breadcrumbFor("/privacy", "Конфіденційність")} />
        <PageIntro
          eyebrow="Ваші дані"
          title={
            <>
              Політика
              <br />
              конфіденційності
            </>
          }
          text={<p>Ця сторінка пояснює, які дані передаються через форми сайту та для чого вони використовуються.</p>}
        />
        <article className="privacy-content">
          <section>
            <span>01</span>
            <div>
              <h2>Які дані ми отримуємо</h2>
              <p>
                Контактна форма передає ім’я, адресу електронної пошти та текст повідомлення. Анкета домашніх груп передає
                ім’я, Telegram-контакт і назви вибраних груп.
              </p>
            </div>
          </section>
          <section>
            <span>02</span>
            <div>
              <h2>Для чого потрібні дані</h2>
              <p>
                Дані використовуються лише для відповіді на звернення, уточнення деталей і зв’язку щодо участі в домашній
                групі.
              </p>
            </div>
          </section>
          <section>
            <span>03</span>
            <div>
              <h2>Як передаються звернення</h2>
              <p>
                Повідомлення контактної форми надсилаються через сервіс FormSubmit. Заявки на домашні групи надходять
                адміністраторам церкви через Telegram. Ці сервіси обробляють дані відповідно до власних умов
                конфіденційності.
              </p>
            </div>
          </section>
          <section>
            <span>04</span>
            <div>
              <h2>Продаж і використання даних</h2>
              <p>Церква не продає дані, отримані через сайт, і не використовує їх для сторонньої реклами.</p>
            </div>
          </section>
          <section>
            <span>05</span>
            <div>
              <h2>Запит на видалення</h2>
              <p>
                Щоб уточнити, виправити або попросити видалити надіслані дані, напишіть на{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>.
              </p>
            </div>
          </section>
        </article>
      </main>
    </Page>
  );
}
