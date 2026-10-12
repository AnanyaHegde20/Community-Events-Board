"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import type { FavouritesResponse } from "@/types/events";

type SaveState = "idle" | "saving" | "saved";

type LoadState = "loading" | "ready" | "error";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PreferencesManager() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSelection, setSavedSelection] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/favourites", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = (await response.json().catch(() => null)) as
          | (Partial<FavouritesResponse> & { error?: string })
          | null;

        if (!response.ok || !Array.isArray(data?.favouriteCategories)) {
          throw new Error(data?.error ?? "Could not load your preferences.");
        }

        return data as FavouritesResponse;
      })
      .then((data) => {
        if (!data || controller.signal.aborted) return;
        setSelected(data.favouriteCategories);
        setSavedSelection(data.favouriteCategories);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error && error.message
            ? error.message
            : "Could not load your preferences.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [reloadKey, router]);

  const hasChanges =
    loadState === "ready" &&
    (selected.length !== savedSelection.length ||
      selected.some((category) => !savedSelection.includes(category)));

  function toggleCategory(category: string) {
    setSaveState("idle");
    setSaveError(null);
    setSelected((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category],
    );
  }

  function retryLoad() {
    setLoadError(null);
    setLoadState("loading");
    setReloadKey((key) => key + 1);
  }

  async function handleSave() {
    if (saveState === "saving") return;

    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/favourites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ favouriteCategories: selected }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | (Partial<FavouritesResponse> & { error?: string })
        | null;

      if (!response.ok || !Array.isArray(data?.favouriteCategories)) {
        setSaveError(data?.error ?? "Unable to save your preferences.");
        setSaveState("idle");
        return;
      }

      setSavedSelection(data.favouriteCategories);
      setSelected(data.favouriteCategories);
      setSaveState("saved");
    } catch {
      setSaveError("Something went wrong. Check your connection and try again.");
      setSaveState("idle");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="eyebrow text-clay">Personalise your board</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Your favourite categories
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-deep/80">
          Pick the kinds of events you enjoy. We use these to personalise{" "}
          <Link
            href="/feed"
            className="font-medium text-clay hover:text-clay-deep"
          >
            My Feed
          </Link>
          , so it only shows gatherings you care about.
        </p>
      </div>

      {loadState === "loading" && (
        <ul
          aria-hidden="true"
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: EVENT_CATEGORIES.length }, (_, index) => (
            <li
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white"
            />
          ))}
        </ul>
      )}

      {loadState === "error" && (
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h2 className="text-base font-semibold text-red-900">
            Could not load your preferences
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
            {loadError}
          </p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-6 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
          >
            Try again
          </button>
        </div>
      )}

      {loadState === "ready" && (
        <>
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_CATEGORIES.map((category) => {
              const isSelected = selected.includes(category);
              return (
                <li key={category}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleCategory(category)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left shadow-sm transition-colors ${
                      isSelected
                        ? "border-clay bg-clay-soft"
                        : "border-zinc-200 bg-white hover:border-clay/50"
                    }`}
                  >
                    <span className="text-base font-semibold text-zinc-900">
                      {category}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-clay text-white"
                          : "border border-zinc-300 text-transparent"
                      }`}
                    >
                      <CheckIcon />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {saveError && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {saveError}
            </p>
          )}

          {saveState === "saved" && !saveError && (
            <p
              role="status"
              className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              Preferences saved. Your feed is up to date.
            </p>
          )}

          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-500">
              {selected.length === 0
                ? "No categories selected yet."
                : `${selected.length} of ${EVENT_CATEGORIES.length} categories selected.`}
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/feed"
                className="h-10 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep"
              >
                View my feed
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === "saving" || !hasChanges}
                className="h-10 rounded-full bg-clay px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveState === "saving" ? "Saving..." : "Save preferences"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
