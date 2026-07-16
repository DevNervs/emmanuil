import { Page, PageHero, SectionTitle } from "../components/SiteShell";
import { site } from "../content";

export default function AboutPage() {
  return (
    <Page active="/about">
      <main>
        <PageHero eyebrow="Про нас" title={<>Ми — люди, які<br />йдуть за Богом<br /><em>разом.</em></>} text="Еммануїл — християнська церква міста Чернівці. Тут можна прийти таким, яким ти є, і знайти простір для віри, дружби та нового кроку." image={site.aboutImage}>
          <a className="button button-wine" href="/contacts">Познайомитися з нами</a>
        </PageHero>

        <section className="mission-section">
          <SectionTitle kicker="Наша місія" title={<>Бути світлом<br />для <em>міста.</em></>} text="Ми віримо, що церква — це не будівля і не програма. Це люди, об’єднані Божою любов’ю, які служать одне одному та своєму місту." />
          <div className="mission-quote">«Ми хочемо, щоб кожна людина відчула: тут її бачать, тут за неї моляться, тут вона не сама».</div>
        </section>

        <section className="history-section">
          <SectionTitle kicker="Наш шлях" title={<>Історія, яку<br />ми пишемо <em>разом.</em></>} />
          <div className="timeline">
            <article><span>Початок</span><h3>Громада, що зібралася навколо віри</h3><p>З простих зустрічей виросла спільнота, у якій знайшлося місце для поколінь, запитань і надії.</p></article>
            <article><span>Зростання</span><h3>Більше служіння для людей поруч</h3><p>Домашні групи, підтримка сімей, праця з молоддю та відкритість для кожного, хто шукає Бога.</p></article>
            <article><span>Сьогодні</span><h3>Церква, відкрита для Чернівців</h3><p>Ми продовжуємо бути спільнотою, де віра стає щоденним життям і добро має конкретні справи.</p></article>
          </div>
        </section>
      </main>
    </Page>
  );
}
