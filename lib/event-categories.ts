export const EVENT_CATEGORIES = [
  "Music",
  "Workshop",
  "Food",
  "Sports",
  "Kids",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
