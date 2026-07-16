import { Page } from "../components/SiteShell";

export default function DonatePage() {
  return (
    <Page>
      <main className="donate-page">
        <p className="overline">Пожертвування</p>
        <h1>Разом ми можемо<br /><em>більше.</em></h1>
        <p>Дякуємо кожному, хто підтримує служіння церкви. Ваша участь допомагає нам бути поруч із людьми та поширювати Боже слово.</p>
        <div className="donate-choices"><a className="button button-wine" href="https://emmanuil.cv.ua/donate">Підтримати онлайн</a><a className="button button-secondary" href="/contacts">Поставити запитання</a></div>
      </main>
    </Page>
  );
}
