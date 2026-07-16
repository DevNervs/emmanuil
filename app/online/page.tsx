import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";

export const metadata: Metadata = { title: "Онлайн — Еммануїл", description: "Графік і трансляція загальних служінь церкви Еммануїл.", alternates: { canonical: "/online" } };

export default function OnlinePage() {
  return <Page active="/online"><main><PageIntro title="Онлайн" text={<><h2>Графік онлайн трансляцій</h2><p><strong>Щонеділі о 10:00 та 17:00</strong> — загальне служіння.</p><p>Якщо у Вас не відображається відео або виникли інші проблеми з трансляцією, просимо написати нам через сторінку контактів.</p></>}><div className="hero-actions"><a className="button button-secondary" href="/contacts">Контакти</a><SocialLink network="youtube" href="https://www.youtube.com/user/EmmanuilCV" label="Відкрити канал Еммануїл на YouTube" className="social-action" /></div></PageIntro><section className="video-section"><div className="video-frame"><iframe src="https://www.youtube.com/embed/live_stream?channel=UCxFwu9_CAk23NIVW3Y7emsQ" title="Онлайн трансляція церкви Еммануїл" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></section></main></Page>;
}
