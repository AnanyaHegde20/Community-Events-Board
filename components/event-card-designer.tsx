"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CARD_STICKERS,
  CARD_THEMES,
  DEFAULT_CARD_STICKERS,
  DEFAULT_CARD_THEME,
  MAX_CARD_STICKERS,
} from "@/lib/card-designs";
import {
  CARD_STICKER_LABELS,
  CARD_THEME_LABELS,
  StickerIcon,
  formatEventDateTime,
  formatPrice,
  themeCardBadgeClass,
  themeCardContainerClass,
  themeCardFooterClass,
  themeCardMetaClass,
  themeCardTitleClass,
} from "@/components/card-design-visuals";
import type { CardDesignData, EventListItem } from "@/types/events";

type Props = {
  event: EventListItem;
  initialDesign: CardDesignData;
  onClose: () => void;
  onSaved: (design: CardDesignData) => void;
};

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="h-3.5 w-3.5 shrink-0 animate-spin"
    >
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function LiveCardPreview({
  event,
  design,
}: {
  event: EventListItem;
  design: CardDesignData;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none w-full max-w-[16rem] shrink-0 overflow-hidden rounded-2xl border shadow-sm transition-colors ${themeCardContainerClass(design.theme)}`}
    >
      <div className="relative aspect-[16/9] w-full bg-zinc-100">
        <Image
          src={event.imageUrl}
          alt=""
          fill
          sizes="16rem"
          className="object-cover"
        />
        <span
          className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${themeCardBadgeClass(design.theme)}`}
        >
          {event.category}
        </span>
        {design.stickers.length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {design.stickers.map((sticker) => (
              <span
                key={sticker}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm"
              >
                <StickerIcon sticker={sticker} className="h-5 w-5" />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col p-4">
        <h4
          className={`text-sm font-semibold transition-colors ${themeCardTitleClass(design.theme)}`}
        >
          {event.title}
        </h4>
        <p
          className={`mt-1 text-xs transition-colors ${themeCardMetaClass(design.theme)}`}
        >
          {event.city} · {formatEventDateTime(event.dateTime)}
        </p>
        <div
          className={`mt-3 flex items-center justify-between border-t pt-3 transition-colors ${themeCardFooterClass(design.theme)}`}
        >
          <span className="text-xs font-semibold text-zinc-900">
            {formatPrice(event.price)}
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500">
            Remind me
          </span>
        </div>
      </div>
    </div>
  );
}

export function EventCardDesigner({
  event,
  initialDesign,
  onClose,
  onSaved,
}: Props) {
  const [theme, setTheme] = useState<CardDesignData["theme"]>(
    initialDesign.theme,
  );
  const [stickers, setStickers] = useState<CardDesignData["stickers"]>(
    initialDesign.stickers,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const requestIdRef = useRef(0);
  // Captures the design the card already had, used only as a fallback if the
  // fresh load fails. Kept in a ref so parent updates don't re-run the effect
  // and clobber in-progress edits.
  const fallbackRef = useRef(initialDesign);

  // Load the freshest saved design each time the dialog opens. The dialog
  // remounts on every open, so the initial state already shows the spinner.
  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    fetch(`/api/events/${event.id}/design`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? "Could not load your design.");
        }

        const data = (await response.json().catch(() => null)) as {
          theme?: unknown;
          stickers?: unknown;
        } | null;

        if (
          !data ||
          typeof data.theme !== "string" ||
          !Array.isArray(data.stickers)
        ) {
          throw new Error("Could not load your design.");
        }

        return data as CardDesignData;
      })
      .then((data) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setTheme(
          CARD_THEMES.includes(data.theme)
            ? data.theme
            : DEFAULT_CARD_THEME,
        );
        setStickers(
          Array.isArray(data.stickers)
            ? data.stickers.filter((s) =>
                (CARD_STICKERS as readonly string[]).includes(s),
              )
            : [...DEFAULT_CARD_STICKERS],
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        // Fall back to whatever the card already had so the user can
        // still edit; saving will overwrite the server copy anyway.
        setTheme(fallbackRef.current.theme);
        setStickers(fallbackRef.current.stickers);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [event.id]);

  // Escape closes the dialog, matching standard modal behaviour.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isDirty =
    theme !== initialDesign.theme ||
    stickers.length !== initialDesign.stickers.length ||
    stickers.some((s, i) => s !== initialDesign.stickers[i]);

  function stop(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function toggleSticker(sticker: (typeof CARD_STICKERS)[number]) {
    setSavedFlash(false);
    setSaveError(null);
    setStickers((current) => {
      if (current.includes(sticker)) {
        return current.filter((value) => value !== sticker);
      }
      if (current.length >= MAX_CARD_STICKERS) return current;
      return [...current, sticker];
    });
  }

  function chooseTheme(nextTheme: (typeof CARD_THEMES)[number]) {
    setSavedFlash(false);
    setSaveError(null);
    setTheme(nextTheme);
  }

  async function handleSave() {
    if (isSaving || isLoading) return;

    setSaveError(null);
    setSavedFlash(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${event.id}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ theme, stickers }),
      });

      const data = (await response.json().catch(() => null)) as {
        theme?: unknown;
        stickers?: unknown;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save your design.");
      }

      const saved: CardDesignData = {
        theme:
          data && CARD_THEMES.includes(data.theme as never)
            ? (data.theme as CardDesignData["theme"])
            : theme,
        stickers:
          data && Array.isArray(data.stickers)
            ? (data.stickers as CardDesignData["stickers"])
            : stickers,
      };

      setTheme(saved.theme);
      setStickers(saved.stickers);
      setSavedFlash(true);
      onSaved(saved);
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to save your design.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const stickerFull = stickers.length >= MAX_CARD_STICKERS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Customize card"
      onClick={(e) => {
        stop(e);
        // Dismiss only on a true backdrop click, never on clicks inside
        // the panel (which bubble up to this overlay).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Customize card
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{event.title}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onClose();
            }}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800"
          >
            <CloseIcon />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 flex justify-center py-10">
            <span
              role="status"
              className="inline-flex items-center gap-2 text-sm text-zinc-500"
            >
              <SpinnerIcon />
              Loading your design...
            </span>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
              <LiveCardPreview event={event} design={{ theme, stickers }} />

              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Theme
                    </h3>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CARD_THEMES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={(e) => {
                          stop(e);
                          chooseTheme(option);
                        }}
                        aria-pressed={theme === option}
                        className={`h-9 rounded-full border px-4 text-xs font-medium shadow-sm transition-colors ${
                          theme === option
                            ? "border-violet-500 bg-violet-50 text-violet-700"
                            : "border-zinc-300 bg-white text-zinc-700 hover:border-violet-300 hover:text-violet-700"
                        }`}
                      >
                        {CARD_THEME_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Stickers
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {stickers.length} of {MAX_CARD_STICKERS} selected
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CARD_STICKERS.map((sticker) => {
                      const selected = stickers.includes(sticker);
                      const disabled = !selected && stickerFull;
                      return (
                        <button
                          key={sticker}
                          type="button"
                          onClick={(e) => {
                            stop(e);
                            toggleSticker(sticker);
                          }}
                          disabled={disabled}
                          aria-pressed={selected}
                          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            selected
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-zinc-300 bg-white text-zinc-700 hover:border-violet-300 hover:text-violet-700"
                          }`}
                        >
                          <StickerIcon sticker={sticker} className="h-4 w-4" />
                          {CARD_STICKER_LABELS[sticker]}
                        </button>
                      );
                    })}
                  </div>
                  {stickerFull && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Maximum of {MAX_CARD_STICKERS} stickers. Remove one to
                      swap it.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {saveError && (
              <p
                role="alert"
                className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {saveError}
              </p>
            )}

            {savedFlash && !saveError && (
              <p
                role="status"
                className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              >
                Design saved.
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  onClose();
                }}
                className="h-10 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  void handleSave();
                }}
                disabled={isSaving || !isDirty}
                aria-busy={isSaving}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <SpinnerIcon />
                    Saving...
                  </>
                ) : (
                  "Save design"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
