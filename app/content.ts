export const site = {
  name: "Еммануїл",
  shortName: "EmmanuilCv",
  address: "м. Чернівці, вул. О. Кобилянської, 53",
  secondAddress: "м. Чернівці, вул. О. Криворучка, 57",
  phones: ["(066) 950 99 77", "(096) 950 99 77"],
  email: "emmanuil.cv@gmail.com",
  services: "Щонеділі о 10:00 та 17:00",
  canonicalUrl: "https://emmanuil.pages.dev",
  socials: {
    facebook: "https://www.facebook.com/emmanuil.cv.ua",
    instagram: "https://www.instagram.com/emmanuilcv/",
    youtube: "https://www.youtube.com/user/EmmanuilCV",
    telegram: "https://t.me/emmanuilcv",
    viber: "https://invite.viber.com/?g2=AQAe6QfRzoySXEs%2FGBAO9%2Bc5IIwOyE3n6Dedj0owub6XcDOVqmwOBCpCTdx1DkGu",
  },
};

export type ServiceLocation = {
  label: string;
  address: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  time: string;
  coordinates: string;
};

export const serviceLocations: ServiceLocation[] = [
  { label: "Криворучка", address: "м. Чернівці, вул. Ореста Криворучка, 57", streetAddress: "вул. Ореста Криворучка, 57", addressLocality: "Чернівці", addressRegion: "Чернівецька область", time: "Щонеділі о 10:00", coordinates: "48.2786111,25.9200516" },
  { label: "Кобилянська", address: "м. Чернівці, вул. Ольги Кобилянської, 53", streetAddress: "вул. Ольги Кобилянської, 53", addressLocality: "Чернівці", addressRegion: "Чернівецька область", time: "Щонеділі о 17:00", coordinates: "48.2864175,25.9394979" },
  { label: "Садгора", address: "м. Чернівці, вул. Васіле Александрі, 8", streetAddress: "вул. Васіле Александрі, 8", addressLocality: "Чернівці", addressRegion: "Чернівецька область", time: "Щонеділі о 10:00", coordinates: "48.3464098,25.9594925" },
  { label: "Сторожинець", address: "м. Сторожинець, вул. Українська, 5", streetAddress: "вул. Українська, 5", addressLocality: "Сторожинець", addressRegion: "Чернівецька область", time: "Щонеділі о 10:00", coordinates: "48.1640400,25.7212200" },
];

export const team = [
  { name: "Никифорець Валерій", role: "Старший пастор церкви Еммануїл", image: "/media/nikiforec.webp", facebook: "https://www.facebook.com/profile.php?id=100010668361401" },
  { name: "Григорчук Олександр", role: "Пастор церкви Еммануїл", image: "/media/grigorchuk.webp", facebook: "https://www.facebook.com/profile.php?id=100002941578783", instagram: "https://www.instagram.com/hryhorchuk_aleksandr/" },
  { name: "Кучурян Костянтин", role: "Пастор церкви Еммануїл", image: "/media/kuchuryan.webp", facebook: "https://www.facebook.com/profile.php?id=1542009203", instagram: "https://www.instagram.com/cuciureanconstantin/" },
  { name: "Клодницький Віталій", role: "Диякон церкви Еммануїл", image: "/media/klodnickij.webp", facebook: "https://www.facebook.com/profile.php?id=100001007664424", instagram: "https://www.instagram.com/vitaliy_klodnytskyi/" },
  { name: "Сємєшкін Єгор", role: "Диякон церкви Еммануїл", image: "/media/semeshkin.webp", instagram: "https://www.instagram.com/sem_egorrr/" },
];

export type NewsCategory = "Подія" | "Відео" | "Історія";
export type NewsItem = {
  title: string;
  date: string;
  publishedAt: string;
  image: string;
  slug: string;
  summary: string;
  category: NewsCategory;
  status: "archived";
  body: string[];
};

export const news: NewsItem[] = [
  { title: "Ноти вдячності", date: "05 жовтня 2025", publishedAt: "2025-10-05", image: "/media/noti.jpg", slug: "noti-vdyachnosti", summary: "День подяки в теплій сімейній атмосфері церкви Еммануїл.", category: "Подія", status: "archived", body: ["Запрошуємо вас та ваших близьких на особливе святкування в нашій церкві — День подяки.", "Ми проведемо час у теплій, сімейній атмосфері з гарною музикою, в подяці Богу та з можливістю творити хороші справи.", "Запрошуйте своїх рідних, друзів та колег.", "Локація: вул. Ольги Кобилянської, 53", "Дата: 19 жовтня", "Час: 10:00 та 17:00"] },
  { title: "Справжня любов", date: "09 березня 2025", publishedAt: "2025-03-09", image: "/media/family-poster.webp", slug: "spravzhnya-lyubov", summary: "Особливий день молитви, підтримки та спілкування.", category: "Подія", status: "archived", body: ["Запрошуємо всіх на особливий день «Справжня любов»!", "Разом ми будемо молитися, ділитися теплом і взаємною підтримкою, відчуваючи справжню любов, яку дарує нам Господь.", "Також запрошуйте своїх рідних, друзів та колег.", "Локація: вул. Ольги Кобилянської, 53", "Дата: 16 березня", "Час: 10:00 та 17:00"] },
  { title: "Реєстрація на сезон домашніх груп 27.01 - 30.03 розпочато!", date: "19 січня 2025", publishedAt: "2025-01-19", image: "/media/home-group.webp", slug: "reestratsiya-na-sezon-domashnikh-grup-27-01-30-03-rozpochato", summary: "Архівне оголошення про сезон домашніх груп.", category: "Подія", status: "archived", body: ["Це чудова можливість для духовного зростання, нових знайомств та підтримки у теплій, дружній атмосфері.", "Разом ми будемо вивчати Божі істини, підтримувати одне одного в молитвах та ділитися досвідом.", "Приєднуйтесь до нас, щоб разом рухатись вперед і відчувати, як Бог веде кожного з нас!"] },
  { title: "Особливий день подяки 20 жовтня 2024", date: "12 жовтня 2024", publishedAt: "2024-10-12", image: "/media/jatva-2024.webp", slug: "osoblivij-den-podyaki-20-zhovtnya-2024", summary: "Архівна афіша особливого дня подяки.", category: "Подія", status: "archived", body: [] },
  { title: "Вся земля співай Осанна", date: "24 серпня 2024", publishedAt: "2024-08-24", image: "/media/osana.webp", slug: "vsia-zemlia-spivai-osanna", summary: "Фрагмент вечора хвали та поклоніння Emmanuil Worship.", category: "Відео", status: "archived", body: ["ВСЯ ЗЕМЛЯ СПІВАЙ ОСАНА | All The Earth Will Sing Your Praises — Paul Baloche | Emmanuil Worship Live", "Фрагмент із вечора хвали та поклоніння команди Emmanuil Worship.", "Автор та оригінальний виконавець: Paul Baloche"] },
  { title: "Водне хрещення 2024 в церкві Emmanuil", date: "07 липня 2024", publishedAt: "2024-07-07", image: "/media/baptism.webp", slug: "vodne-khreshchennya-2024-v-tserkvi-emmanuil", summary: "Водне хрещення в церкві Еммануїл.", category: "Історія", status: "archived", body: ["«Тож ідіть, і навчіть всі народи, христячи їх в Ім’я Отця, і Сина, і Святого Духа»", "Від Матвія 28:19"] },
  { title: "Свято для дітей з багатодітних сімей та сиріт", date: "08 червня 2024", publishedAt: "2024-06-08", image: "/media/childrens.webp", slug: "svyato-dlya-ditej-z-bagatoditnikh-simej-ta-sirit", summary: "Спільне служіння церкви та благодійної організації дітям.", category: "Історія", status: "archived", body: ["08.06 церква Еммануїл разом з партнерами благодійної організації провели захід для дітей з багатодітних сімей та сиріт.", "Дякуємо Господу за цей час та можливість служити діткам."] },
  { title: "Надія для сімʼї", date: "04 березня 2024", publishedAt: "2024-03-04", image: "/media/hope-family.webp", slug: "nadiia-dlia-sim-i", summary: "Архівна публікація особливого дня для сімей.", category: "Подія", status: "archived", body: ["Зараз, як ніколи, важливо бути в єдності та любові!", "Тому запрошуємо вас на особливий день — «Надія для сімʼї».", "17 березня о 10:00 та 17:00.", "Запрошуйте друзів, рідних, близьких та сусідів. Ми будемо раді бачити кожного!"] },
  { title: "Домашні групи, як це?", date: "20 лютого 2024", publishedAt: "2024-02-20", image: "/media/homegroup-how.webp", slug: "domashni-hrupy-iak-tse", summary: "Навіщо потрібні домашні групи та як проходять зустрічі.", category: "Історія", status: "archived", body: ["Розпочався сезон домашніх груп. І трішки розповімо вам про них.", "В нас є 13 домашніх груп з різними напрямками. Кожна група збирається у відповідний час та місці.", "Чому такі зустрічі важливі? Це особливий час з людьми, які не просто будуть допомагати вам рости духовно, але ви також можете дізнатися багато чого нового для себе.", "На домашках створюється справжня дружба. Там ви зустрінете людей, які вислухають вас та підтримають.", "Чекаємо саме на тебе!"] },
];

export const newsHref = (item: NewsItem) => `/news/${item.slug}`;

export type Group = { title: string; leaders: string; time: string; address?: string; coordinates?: string };

export const groups: Group[] = [
  { title: "№1. Духовний ріст", leaders: "Клодницький Віталій", time: "Четвер, 19:00", address: "вул. О. Кобилянської 53, 1-й поверх, офіс", coordinates: "48.2864175,25.9394979" },
  { title: "№2. Духовний ріст", leaders: "Григорчук Олександр, Маковей Богдан", time: "Середа, 19:00", address: "вул. О. Кобилянської 53, 1-й поверх, офіс", coordinates: "48.2864175,25.9394979" },
  { title: "№3. Духовний ріст", leaders: "Маковій Михайло, Никифорець Валерій", time: "Вівторок, 18:00", address: "вул. О. Криворучки 57, 2-й поверх", coordinates: "48.2786111,25.9200516" },
  { title: "№4. Духовний ріст", leaders: "Сємєшкін Єгор", time: "Четвер, 19:00", address: "вул. Скальда 31Г (вул. Комарова)", coordinates: "48.2552907,25.9326718" },
  { title: "№5. Духовний ріст", leaders: "Данильченко Богдан", time: "Вівторок, 19:00", address: "вул. Скальда 31Г (вул. Комарова)", coordinates: "48.2552907,25.9326718" },
  { title: "№6. Група для дівчат. НЕІНСТАГРАМНА", leaders: "Войтоловська О., Чвельова А.", time: "Середа, 19:00", address: "вул. Нагірна, 7Д", coordinates: "48.2866216,25.9296352" },
  { title: "№7. Група для нечуючих «Послання до Євреїв»", leaders: "Гренюк Лея", time: "Вівторок, 18:30", address: "вул. О. Кобилянської 53, 2-й поверх, маленький кабінет", coordinates: "48.2864175,25.9394979" },
  { title: "№8. Садгора. Шлях до Батька", leaders: "Лупуляк Віталій", time: "Вівторок, 18:00", address: "вул. Васіле Александрі, 8 (Баронський двір)", coordinates: "48.3464098,25.9594925" },
  { title: "№9. Садгора. Молодіжна група", leaders: "Кучурян Іван, Прокопчук Едуард", time: "Середа, 19:00", address: "вул. Васіле Александрі, 8 (Баронський двір)", coordinates: "48.3464098,25.9594925" },
  { title: "№10. Садгора. Розбір Біблії", leaders: "Пол Логан, Прокопчук Едуард", time: "П’ятниця, 15:00", address: "вул. Підкови 11-А", coordinates: "48.3515346,25.9540737" },
  { title: "№11. Сторожинець — «1 Послання до Коринтян»", leaders: "Шкіль В., Осипенко А.", time: "Четвер, 18:00", address: "м. Сторожинець, вул. Українська 5", coordinates: "48.1640400,25.7212200" },
  { title: "№12. Молодіжна група. Розбір книги «Обʼявлення»", leaders: "Григорчук Марк", time: "Четвер, 19:00", address: "вул. О. Криворучки 57, 2-й поверх", coordinates: "48.2786111,25.9200516" },
  { title: "№13. Молодіжна група. «1 Послання до Коринтян»", leaders: "Козачук Даніел", time: "Четвер, 19:00", address: "вул. О. Кобилянської 53, 2-й поверх, великий кабінет", coordinates: "48.2864175,25.9394979" },
  { title: "№14. Молодіжна група. Духовний ріст", leaders: "Головко Е., Лисьонок М.", time: "Четвер, 19:00", address: "с. Годилів, вул. Яремчука 3", coordinates: "48.2442809,25.9332185" },
  { title: "№15. Молодіжна домашня група", leaders: "Лисьонок Віктор", time: "Четвер, 19:00" },
];

export const donation = {
  card: "5169 3351 0214 2888",
  paymentUrl: "https://shorts.pb.ua/-/de87b1f8",
  purpose: "Добровільні пожертвування",
  receiver: "ЦЕРКВА ЕММАНУЇЛ ХВЄП М. ЧЕРНIВЦI",
  code: "38843862",
  accounts: [
    { currency: "UAH", iban: "UA663052990000026004001802110", bank: "ЧЕРНIВЕЦЬКА ФIЛIЯ АТ КБ «ПРИВАТБАНК»" },
    { currency: "USD", iban: "UA133052990000026004041802954", bank: "JSC CB «PRIVATBANK», 1D HRUSHEVSKOHO STR., KYIV, 01001, UKRAINE", swift: "PBANUA2X" },
    { currency: "EUR", iban: "UA803052990000026009011802097", bank: "JSC CB «PRIVATBANK», 1D HRUSHEVSKOHO STR., KYIV, 01001, UKRAINE", swift: "PBANUA2X" },
  ],
};
