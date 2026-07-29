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
  heroVideoUrl?: string;
  heroAnnouncement?: string;
  homeGroupLocations?: HomeGroupLocation[];
  services?: ServiceSchedule[];
}

export interface HomeGroupLocation {
  id: number;
  name: string;
  address: string;
  showOnHome: boolean;
}

export interface ServiceSchedule {
  id: number;
  name: string;
  time: string;
  location: string;
  showOnHome: boolean;
}
