import type { CardSticker, CardTheme } from "@/lib/card-designs";
import type { EventCategory } from "@/lib/event-categories";

export type EventListItem = {
  id: string;
  title: string;
  category: EventCategory;
  city: string;
  dateTime: string;
  price: number;
  description: string;
  imageUrl: string;
};

export type EventsApiResponse = {
  events: EventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  cities: string[];
};

export type FeedApiResponse = {
  events: EventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type FavouritesResponse = {
  favouriteCategories: EventCategory[];
};

export type ReminderResponse = {
  enabled: boolean;
};

export type CardDesignData = {
  theme: CardTheme;
  stickers: CardSticker[];
};

export type CardDesignResponse = CardDesignData;

export type AdminEventListItem = EventListItem & {
  isActive: boolean;
};

export type AdminEventsSummary = {
  total: number;
  active: number;
  inactive: number;
};

export type AdminEventsApiResponse = {
  events: AdminEventListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: AdminEventsSummary;
};

export type AdminEventMutationResponse = {
  event: AdminEventListItem;
};
