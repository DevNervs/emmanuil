export interface Group {
  id: number;
  title: string;
  leaders: string;
  description: string;
  time: string;
  day?: string;
  address?: string;
  coordinates?: string;
  showOnHome?: boolean;
}

export interface Season {
  id: string;
  name: string;
  startedAt: number;
  archivedAt?: number;
}

export interface GroupApplication {
  id: string;
  name: string;
  phone: string;
  groups: number[];
  groupNames: string[];
  createdAt: number;
  seasonId: string;
  status?: "new" | "in_progress" | "done";
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface SiteConfig {
  hero?: HeroConfig;
  announcement?: Announcement | null;
  promo?: PromoConfig;
  serviceLocations?: ServiceLocationConfig[];
  team?: TeamMemberConfig[];
}

export interface PromoConfig {
  enabled: boolean;
  videoUrl: string;
  posterUrl?: string;
  title: string;
  description: string;
}

export interface HeroConfig {
  hlsUrl?: string;
  fallbackUrl?: string;
  posterUrl?: string;
  posterSrcSet?: string;
}

export interface Announcement {
  text: string;
  href?: string;
  enabled: boolean;
}

export interface ServiceLocationConfig {
  id: number;
  label: string;
  address: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  time: string;
  coordinates: string;
  mapsUrl: string;
  showOnHome?: boolean;
}

export interface TeamMemberConfig {
  id: number;
  name: string;
  role: string;
  image: string;
  facebook?: string;
  instagram?: string;
}
