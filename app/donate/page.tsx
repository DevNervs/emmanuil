import type { Metadata } from "next";
import { Page, PageIntro } from "../components/SiteShell";
import { CopyButton } from "../components/InteractionTools";
import { donation } from "../content";

export const metadata: Metadata = { title: "Пожертвувати — Еммануїл", description: "Реквізити для добровільних пожертвувань церкві Еммануїл.", alternates: { canonical: "/donate" } };

export default function DonatePage() {
  return <Page active="/donate"><main><PageIntro title="Пожертвувати" text={<><blockquote>«...щоб хто сіє й хто жне разом раділи.»<cite>Євангеліє від Івана 4:36</cite></blockquote></>}><a className="button button-wine" href={donation.paymentUrl}>Пожертвувати через ПриватБанк</a></PageIntro><section className="donation-section"><div className="card-number"><span>Картка ПриватБанк</span><strong>{donation.card}</strong><CopyButton value={donation.card.replaceAll(" ", "")} label="Копіювати номер картки" /><p>Призначення платежу: {donation.purpose}</p></div><div className="account-grid">{donation.accounts.map((account) => <article key={account.currency}><span>{account.currency}</span><h2>{account.currency === "UAH" ? "Гривня" : account.currency === "USD" ? "Долар" : "Євро"}</h2><dl><dt>Назва отримувача</dt><dd>{donation.receiver}</dd><dt>Код отримувача</dt><dd>{donation.code}</dd>{account.swift ? <><dt>Код SWIFT</dt><dd>{account.swift}</dd></> : null}<dt>Рахунок IBAN</dt><dd>{account.iban}</dd><dt>Назва банку</dt><dd>{account.bank}</dd><dt>Призначення платежу</dt><dd>{donation.purpose}</dd></dl><CopyButton value={account.iban} label="Копіювати IBAN" /></article>)}</div><p className="donation-note">Сума пожертви НЕ підлягає поверненню!</p></section></main></Page>;
}
