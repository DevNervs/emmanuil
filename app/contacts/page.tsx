import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { ContactForm } from "../components/InteractionTools";
import { site } from "../content";

export const metadata: Metadata = { title: "Контакти — Еммануїл", description: "Адреси, телефони, електронна пошта та соціальні мережі церкви Еммануїл у Чернівцях." };

export default function ContactsPage() {
  return <Page active="/contacts"><main><PageIntro title="Контакти" /><section className="contacts-layout"><div className="contact-block"><h2>Наші контакти</h2><address><strong>{site.address}</strong><a href="tel:+380669509977">{site.phones[0]}</a><a href="tel:+380969509977">{site.phones[1]}</a><a href={`mailto:${site.email}`}>{site.email}</a></address><address><strong>{site.secondAddress}</strong></address></div><div className="contact-block"><h2>Реабілітаційний центр</h2><p>Якщо ви знаєте людей, які знаходяться в наркотичній, алкогольній чи ін. залежностях, звертайтеся:</p><address><strong>с. Великий Кучурів, Чернівецька обл.</strong><a href="tel:+380989423713">(098) 942 37 13</a><a href="tel:+380508476116">(050) 847 61 16</a><a href="tel:+380372904032">(0372) 90 40 32</a><a href={`mailto:${site.email}`}>{site.email}</a></address></div><div className="contact-block"><h2>Соціальні мережі</h2><div className="contact-socials"><a href={site.socials.facebook} target="_blank" rel="noreferrer">Facebook</a><a href={site.socials.instagram} target="_blank" rel="noreferrer">Instagram</a><a href={site.socials.youtube} target="_blank" rel="noreferrer">YouTube</a><a href={site.socials.telegram} target="_blank" rel="noreferrer">Telegram</a><a href={site.socials.viber} target="_blank" rel="noreferrer">Viber</a></div></div></section><section className="form-section"><div><p className="overline">Написати нам</p><h2>Контактна форма</h2></div><ContactForm email={site.email} /></section></main></Page>;
}
