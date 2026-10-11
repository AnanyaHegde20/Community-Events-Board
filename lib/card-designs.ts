export const CARD_THEMES = ["classic", "vibrant", "minimal"] as const;

export type CardTheme = (typeof CARD_THEMES)[number];

export const CARD_STICKERS = [
  "star",
  "heart",
  "music",
  "sparkles",
  "party",
] as const;

export type CardSticker = (typeof CARD_STICKERS)[number];

export const MAX_CARD_STICKERS = 3;

export const DEFAULT_CARD_THEME: CardTheme = "classic";

export const DEFAULT_CARD_STICKERS: CardSticker[] = [];
