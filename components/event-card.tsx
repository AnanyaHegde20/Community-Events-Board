"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_CARD_STICKERS,
  DEFAULT_CARD_THEME,
} from "@/lib/card-designs";
import {
  StickerBadges,
  formatEventDateTime,
  formatPrice,
  themeCardBadgeClass,
  themeCardContainerClass,
  themeCardFooterClass,
  themeCardHoverClass,
  themeCardMetaClass,
  themeCardTitleClass,
} from "@/components/card-design-visuals";
import { EventCardDesigner } from "@/components/event-card-designer";
import { RemindMeButton } from "@/components/remind-me-button";
import type { CardDesignData, EventListItem } from "@/types/events";

// Re-exported for backwards compatibility; implementations live in
// card-design-visuals so the designer can share them without a cycle.
export { formatEventDateTime, formatPrice };

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="M12 21s-6-5.1-6-10a6 6 0 0 1 12 0c0 4.9-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <circle cx="13.5" cy="6.5" r="0.5" />
      <circle cx="17.5" cy="10.5" r="0.5" />
      <circle cx="8.5" cy="7.5" r="0.5" />
      <circle cx="6.5" cy="12.5" r="0.5" />
      <path d="M12 2a10 10 0 0 0 0 20c.6 0 1-.4 1-1v-1.5a1.5 1.5 0 0 1 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4.5-8-9-8Z" />
    </svg>
  );
}

type DesignLoad =
  | { status: "signed-out" }
  | { status: "ready"; design: CardDesignData };

export function EventCard({ event }: { event: EventListItem }) {
  const router = useRouter();
  const pathname = usePathname();
  const [design, setDesign] = useState<CardDesignData>({
    theme: DEFAULT_CARD_THEME,
    stickers: [...DEFAULT_CARD_STICKERS],
  });
  const [isSignedOut, setIsSignedOut] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    fetch(`/api/events/${event.id}/design`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response): Promise<DesignLoad> => {
        if (response.status === 401) {
          return { status: "signed-out" };
        }

        const data = (await response.json().catch(() => null)) as {
          theme?: unknown;
          stickers?: unknown;
          error?: string;
        } | null;

        if (
          !response.ok ||
          !data ||
          typeof data.theme !== "string" ||
          !Array.isArray(data.stickers)
        ) {
          throw new Error(data?.error ?? "Could not load your design.");
        }

        return { status: "ready", design: data as CardDesignData };
      })
      .then((result) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        if (result.status === "signed-out") {
          setIsSignedOut(true);
          return;
        }

        setDesign(result.design);
      })
      .catch(() => {
        // Keep the default design; the Customize dialog can still retry.
      });

    return () => controller.abort();
  }, [event.id, reloadKey]);

  function handleCustomizeClick(clickEvent: React.MouseEvent) {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    if (isSignedOut) {
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
      return;
    }

    setDesignerOpen(true);
  }

  return (
    <li
      className={`group flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${themeCardContainerClass(design.theme)} ${themeCardHoverClass(design.theme)} hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/5`}
    >
      <div className="photo-frame relative aspect-[16/10] w-full overflow-hidden bg-mist">
        <Image
          src={event.imageUrl}
          alt={event.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <span
          className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase transition-colors ${themeCardBadgeClass(design.theme)}`}
        >
          {event.category}
        </span>
        <StickerBadges stickers={design.stickers} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p
          className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold tracking-widest uppercase transition-colors ${themeCardMetaClass(design.theme)}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon />
            {formatEventDateTime(event.dateTime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PinIcon />
            {event.city}
          </span>
        </p>

        <h3
          className={`mt-2 font-display text-xl leading-snug font-semibold tracking-tight transition-colors ${themeCardTitleClass(design.theme)}`}
        >
          {event.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-deep/75">
          {event.description}
        </p>

        <div
          className={`mt-auto border-t pt-4 transition-colors ${themeCardFooterClass(design.theme)}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={
                event.price > 0
                  ? "font-display text-lg font-semibold text-ink"
                  : "font-display text-lg font-semibold text-sage"
              }
            >
              {formatPrice(event.price)}
            </span>
            <RemindMeButton eventId={event.id} />
          </div>

          <button
            type="button"
            onClick={handleCustomizeClick}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-ink/25 bg-transparent px-3.5 text-xs font-medium text-slate-deep transition-colors hover:border-clay hover:text-clay"
          >
            <PaletteIcon />
            Customize card
          </button>
        </div>
      </div>

      {designerOpen && (
        <EventCardDesigner
          event={event}
          initialDesign={design}
          onClose={() => setDesignerOpen(false)}
          onSaved={(saved) => {
            setDesign(saved);
            setReloadKey((key) => key + 1);
          }}
        />
      )}
    </li>
  );
}

export function EventCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-3xl border border-ink/10 bg-white">
      <div className="aspect-[16/10] w-full animate-pulse bg-mist" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/2 animate-pulse rounded bg-mist" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-mist" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-mist" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-mist" />
      </div>
    </li>
  );
}
