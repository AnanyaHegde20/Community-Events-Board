import type { CardSticker, CardTheme } from "@/lib/card-designs";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  if (price <= 0) return "Free";
  return inrFormatter.format(price);
}

export function formatEventDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const day = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toUpperCase();
  return `${day}, ${time}`;
}

export const CARD_THEME_LABELS: Record<CardTheme, string> = {
  classic: "Classic",
  vibrant: "Vibrant",
  minimal: "Minimal",
};

export const CARD_STICKER_LABELS: Record<CardSticker, string> = {
  star: "Star",
  heart: "Heart",
  music: "Music",
  sparkles: "Sparkles",
  party: "Party",
};

export function themeCardContainerClass(theme: CardTheme): string {
  switch (theme) {
    case "vibrant":
      return "border-clay/30 bg-clay-soft";
    case "minimal":
      return "border-ink/10 bg-paper";
    case "classic":
    default:
      return "border-ink/10 bg-white";
  }
}

export function themeCardHoverClass(theme: CardTheme): string {
  switch (theme) {
    case "vibrant":
      return "hover:border-clay/60";
    case "minimal":
      return "hover:border-ink/30";
    case "classic":
    default:
      return "hover:border-clay/45";
  }
}

export function themeCardBadgeClass(theme: CardTheme): string {
  switch (theme) {
    case "vibrant":
      return "bg-clay text-paper";
    case "minimal":
      return "bg-ink text-paper";
    case "classic":
    default:
      return "bg-ink/85 text-paper backdrop-blur";
  }
}

export function themeCardTitleClass(theme: CardTheme): string {
  switch (theme) {
    case "vibrant":
      return "text-clay-deep";
    case "minimal":
      return "text-ink";
    case "classic":
    default:
      return "text-ink";
  }
}

export function themeCardMetaClass(theme: CardTheme): string {
  switch (theme) {
    case "vibrant":
      return "text-clay-deep/80";
    case "minimal":
      return "text-slate-soft";
    case "classic":
    default:
      return "text-slate-soft";
  }
}

export function themeCardFooterClass(theme: CardTheme): string {
  switch (theme) {
    case "vibrant":
      return "border-clay/20";
    case "minimal":
      return "border-ink/10";
    case "classic":
    default:
      return "border-ink/10";
  }
}

const STICKER_FILLS: Record<CardSticker, string> = {
  star: "text-amber-600",
  heart: "text-clay",
  music: "text-slate-deep",
  sparkles: "text-sage",
  party: "text-clay-deep",
};

export function StickerIcon({
  sticker,
  className = "h-5 w-5",
}: {
  sticker: CardSticker;
  className?: string;
}) {
  const fill = STICKER_FILLS[sticker];

  switch (sticker) {
    case "star":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} ${fill}`}
        >
          <path d="m12 2 2.9 6.26 6.6.7-4.9 4.5 1.3 6.54L12 16.9l-5.9 3.1 1.3-6.54-4.9-4.5 6.6-.7L12 2Z" />
        </svg>
      );
    case "heart":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} ${fill}`}
        >
          <path d="M12 21s-6.7-4.35-9.33-8.1C.9 10.3 1.6 6.5 4.6 5.2c2-.9 4.2-.2 5.5 1.4L12 8l1.9-1.4c1.3-1.6 3.5-2.3 5.5-1.4 3 1.3 3.7 5.1 1.93 7.7C18.7 16.65 12 21 12 21Z" />
        </svg>
      );
    case "music":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} ${fill}`}
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "sparkles":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} ${fill}`}
        >
          <path d="m12 3 1.9 4.8 4.8 1.9-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9L12 3Z" />
          <path d="M19 14.5 19.8 16.4 21.7 17.2 19.8 18 19 19.9 18.2 18 16.3 17.2 18.2 16.4 19 14.5Z" />
          <path d="M5.5 15.5 6.1 17 7.6 17.6 6.1 18.2 5.5 19.7 4.9 18.2 3.4 17.6 4.9 17 5.5 15.5Z" />
        </svg>
      );
    case "party":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${className} ${fill}`}
        >
          <path d="M2.6 21.4 9.3 12l2.7 2.7-9.4 6.7Z" />
          <path d="M14 3.5c.6-.9 1.7-1.3 2.6-.9.9.4 1.3 1.5.9 2.6-.3.8-1 1.3-1.7 1.4l-.9-3.1Z" />
          <path d="M19.2 9c.9-.4 2-.1 2.5.8.4.9.1 2-.8 2.5-.7.3-1.5.2-2-.2l.3-3.1Z" />
          <circle cx="14.5" cy="12.5" r="1.1" />
          <circle cx="18.5" cy="16" r="1.1" />
          <circle cx="13" cy="17.5" r="1.1" />
        </svg>
      );
  }
}

export function StickerBadges({
  stickers,
  className = "h-5 w-5",
}: {
  stickers: CardSticker[];
  className?: string;
}) {
  if (stickers.length === 0) return null;

  return (
    <div className="absolute top-3 right-3 flex items-center gap-1">
      {stickers.map((sticker) => (
        <span
          key={sticker}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm"
        >
          <StickerIcon sticker={sticker} className={className} />
        </span>
      ))}
    </div>
  );
}
