const team = [
  {
    name: "Никифорець Валерій",
    role: "Старший пастор церкви Еммануїл",
    image: "https://emmanuil.cv.ua/images/2026/02/02/nikiforec.jpg",
  },
  {
    name: "Григорчук Олександр",
    role: "Пастор церкви Еммануїл",
    image: "https://emmanuil.cv.ua/images/2026/02/02/grigorchuk.jpg",
  },
  {
    name: "Кучурян Костянтин",
    role: "Пастор церкви Еммануїл",
    image: "https://emmanuil.cv.ua/images/2026/02/02/kuchuryan.jpg",
  },
];

const news = [
  {
    title: "Ноти вдячності",
    date: "05 жовтня 2025",
    image: "https://emmanuil.cv.ua/images/2025/10/05/noti_thumbnail.jpg",
  },
  {
    title: "Справжня любов",
    date: "09 березня 2025",
    image:
      "https://emmanuil.cv.ua/images/2025/03/09/family-poster_thumbnail.jpg",
  },
  {
    title: "Домашні групи: сезон розпочато",
    date: "19 січня 2025",
    image:
      "https://emmanuil.cv.ua/images/2025/03/09/home-group-27-01_thumbnail.jpg",
  },
];

export default function Home() {
  return (
    <main>
      <div className="topline">
        <p>Християнська церква в Чернівцях</p>
        <a href="#contacts">вул. О. Кобилянської, 53</a>
      </div>

      <header className="site-header" aria-label="Основна навігація">
        <a className="brand" href="#home" aria-label="Еммануїл — головна">
          <span className="brand-mark" aria-hidden="true">Е</span>
          <span>Еммануїл</span>
        </a>
        <nav className="nav-links" aria-label="Розділи сайту">
          <a href="#about">Про нас</a>
          <a href="#groups">Домашні групи</a>
          <a href="#news">Новини</a>
          <a href="#contacts">Контакти</a>
        </nav>
        <a className="header-cta" href="#support">Підтримати</a>
      </header>

      <section className="hero" id="home" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow">Спільнота, що йде поруч</p>
          <h1 id="hero-heading">Разом.<br />Для міста.<br /><em>Для Бога.</em></h1>
          <p className="hero-lede">
            Еммануїл — християнська церква Чернівців, де можна
            зростати духовно, знаходити друзів і бути частиною чогось більшого.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#about">Дізнатися більше</a>
            <a className="text-link" href="#groups">Знайти домашню групу <span aria-hidden="true">↘</span></a>
          </div>
        </div>
        <div className="hero-gallery" aria-label="Життя церкви Еммануїл">
          <figure className="hero-image hero-image-main">
            <img src="https://emmanuil.cv.ua/images/slide/wslider_04.jpg" alt="Подія церкви Еммануїл" />
          </figure>
          <figure className="hero-image hero-image-small">
            <img src="https://emmanuil.cv.ua/images/slide/wslider_01.jpg" alt="Спільнота церкви" />
          </figure>
          <div className="hero-caption">Чернівці<br />Україна</div>
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-heading">
        <div className="section-label"><span>01</span> Хто ми</div>
        <div className="about-intro">
          <h2 id="about-heading">Місце, де віра<br />стає <em>життям.</em></h2>
          <p>
            Церква Еммануїл — це спільнота, де люди можуть зростати духовно.
            Ми збираємось, щоб пізнавати Бога, підтримувати одне одного та бути
            добрими сусідами для нашого міста.
          </p>
        </div>
        <div className="pillars" aria-label="Напрями спільноти">
          <article className="pillar">
            <span>01</span>
            <h3>Поклоніння</h3>
            <p>Зупинитися, подякувати й спрямувати серце до Бога.</p>
          </article>
          <article className="pillar">
            <span>02</span>
            <h3>Учнівство</h3>
            <p>Вчитися жити вірою у звичайних щоденних речах.</p>
          </article>
          <article className="pillar">
            <span>03</span>
            <h3>Духовний ріст</h3>
            <p>Рости разом — чесно, уважно й з надією.</p>
          </article>
        </div>
      </section>

      <section className="groups-section" id="groups" aria-labelledby="groups-heading">
        <div className="groups-image">
          <img src="https://emmanuil.cv.ua/images/videos/child.jpg" alt="Зустріч спільноти" />
        </div>
        <div className="groups-copy">
          <p className="eyebrow">Ближче одне до одного</p>
          <h2 id="groups-heading">Велика церква<br />починається з<br /><em>малого кола.</em></h2>
          <p>
            Домашні групи — це простір для розмов, молитви, запитань і
            справжньої підтримки. Знайдіть людей поруч із вами.
          </p>
          <a className="button button-light" href="#contacts">Про домашні групи</a>
        </div>
      </section>

      <section className="team-section" aria-labelledby="team-heading">
        <div className="section-heading-row">
          <div className="section-label section-label-light"><span>02</span> Люди</div>
          <h2 id="team-heading">Служителі<br /><em>Еммануїлу.</em></h2>
          <p>Люди, які служать церкві та її спільноті щодня.</p>
        </div>
        <div className="team-grid">
          {team.map((person) => (
            <article className="team-card" key={person.name}>
              <img src={person.image} alt={person.name} />
              <div>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="news-section" id="news" aria-labelledby="news-heading">
        <div className="news-header">
          <div className="section-label"><span>03</span> Новини</div>
          <h2 id="news-heading">Історії, що<br /><em>продовжуються.</em></h2>
          <a className="text-link" href="#contacts">Усі новини <span aria-hidden="true">↘</span></a>
        </div>
        <div className="news-grid">
          {news.map((item, index) => (
            <article className={`news-card news-card-${index + 1}`} key={item.title}>
              <img src={item.image} alt="" />
              <div className="news-meta"><time>{item.date}</time><span>Новини</span></div>
              <h3>{item.title}</h3>
              <a href="#contacts" aria-label={`Читати новину: ${item.title}`}>Читати <span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="support-section" id="support" aria-labelledby="support-heading">
        <div className="support-symbol" aria-hidden="true">✦</div>
        <div>
          <p className="eyebrow">Пожертвування</p>
          <h2 id="support-heading">Поширюємо<br />Царство Бога <em>разом.</em></h2>
        </div>
        <div className="support-copy">
          <p>Дякуємо кожному, хто підтримує нас молитовно чи фінансово у розповсюдженні Божого слова.</p>
          <a className="button button-primary" href="https://emmanuil.cv.ua/donate">Пожертвувати</a>
        </div>
      </section>

      <footer id="contacts" className="site-footer">
        <div className="footer-brand">
          <a className="brand brand-light" href="#home"><span className="brand-mark" aria-hidden="true">Е</span><span>Еммануїл</span></a>
          <p>Християнська церква<br />міста Чернівці.</p>
        </div>
        <address>
          <a href="https://maps.google.com/?q=48.2861034,25.9393799">м. Чернівці,<br />вул. О. Кобилянської, 53</a>
          <a href="tel:+380506021866">+38 (050) 602 18 66</a>
          <a href="mailto:emmanuil.cv@gmail.com">emmanuil.cv@gmail.com</a>
        </address>
        <div className="footer-links">
          <a href="https://emmanuil.cv.ua/live">Онлайн</a>
          <a href="https://emmanuil.cv.ua/about-us/mi-virimo">Ми віримо</a>
          <a href="https://emmanuil.cv.ua/donate">Підтримати</a>
        </div>
        <p className="copyright">© 2026 Еммануїл Чернівці</p>
      </footer>
    </main>
  );
}
