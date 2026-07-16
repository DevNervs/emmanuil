import { Page, PageIntro } from "../components/SiteShell";

export default function OnlinePage() {
  return <Page active="/online"><main><PageIntro title="Онлайн" text={<><h2>Графік онлайн трансляцій</h2><p><strong>Щонеділі о 10:00 та 17:00</strong> — загальне служіння.</p><p>Якщо у Вас не відображається відео або виникли інші проблеми з трансляцією, просимо написати нам через сторінку контактів.</p></>}><a className="button button-secondary" href="/contacts">Контакти</a></PageIntro><section className="video-section"><div className="video-frame"><iframe src="https://www.youtube.com/embed/live_stream?channel=UCxFwu9_CAk23NIVW3Y7emsQ" title="Онлайн трансляція церкви Еммануїл" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section></main></Page>;
}
