type SocialNetwork = "facebook" | "instagram" | "youtube" | "telegram" | "viber";

const names: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  telegram: "Telegram",
  viber: "Viber",
};

export function SocialLink({ network, href, label, className = "" }: { network: SocialNetwork; href: string; label?: string; className?: string }) {
  const accessibleLabel = label ?? names[network];
  return (
    <a className={`social-icon-link ${className}`.trim()} href={href} target="_blank" rel="noreferrer" aria-label={accessibleLabel} title={accessibleLabel}>
      <span className={`social-brand social-brand-${network}`} aria-hidden="true">{network === "facebook" ? "f" : network === "viber" ? "☎︎" : ""}</span>
    </a>
  );
}
