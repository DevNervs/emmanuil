import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { SocialLink } from "../components/SocialLink";
import { LiveStream } from "../components/LiveStream";

export const metadata: Metadata = { title: "Онлайн-служіння", description: "Онлайн-трансляції недільних служінь християнської церкви Еммануїл у Чернівцях о 10:00 та 17:00.", alternates: { canonical: "/online" } };

export default function OnlinePage() {
  return <Page active="/online"><main><PageIntro eyebrow="Приєднуйтеся звідусіль" title="Онлайн" text={<><h2>Графік онлайн-трансляцій</h2><p><strong>Щонеділі о 10:00 та 17:00</strong> — загальне служіння.</p><p>Якщо відео не відображається або вам потрібна допомога, напишіть нам через сторінку контактів.</p></>}><div className="hero-actions"><a className="button button-secondary" href="/contacts">Контакти</a><SocialLink network="youtube" href="https://www.youtube.com/@EmmanuilCV" label="Відкрити канал Еммануїл на YouTube" className="social-action" /></div></PageIntro><section className="video-section"><LiveStream /></section></main></Page>;
}
