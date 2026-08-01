import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaTelegramPlane, FaViber, FaYoutube } from "react-icons/fa";

type SocialNetwork = "facebook" | "instagram" | "youtube" | "telegram" | "viber";

const names: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  telegram: "Telegram",
  viber: "Viber",
};

const icons: Record<SocialNetwork, IconType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
  telegram: FaTelegramPlane,
  viber: FaViber,
};

export function SocialLink({ network, href, label, className = "" }: { network: SocialNetwork; href: string; label?: string; className?: string }) {
  const accessibleLabel = label ?? names[network];
  const Icon = icons[network];
  return (
    <a className={`social-icon-link ${className}`.trim()} href={href} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel} title={accessibleLabel}>
      <Icon className="social-brand-icon" aria-hidden="true" />
    </a>
  );
}
