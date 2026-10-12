"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { EventCard, EventCardSkeleton } from "@/components/event-card";
import type { EventsApiResponse } from "@/types/events";

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 400;

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronLeftIcon() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type FetchResult = {
  queryKey: string;
  status: "success" | "error";
  data: EventsApiResponse | null;
  errorMessage: string;
};

export function EventsBrowser() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const queryKey = useMemo(
    () => JSON.stringify({ category, city, search, page, reloadKey }),
    [category, city, search, page, reloadKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    fetch(`/api/events?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as Partial<
          EventsApiResponse
        > & { error?: string };

        if (!response.ok || !Array.isArray(payload.events)) {
          throw new Error(payload.error ?? "Could not load events.");
        }

        return payload as EventsApiResponse;
      })
      .then((payload) => {
        if (requestId !== requestIdRef.current) return;

        setResult({
          queryKey,
          status: "success",
          data: payload,
          errorMessage: "",
        });

        if (payload.totalPages > 0 && page > payload.totalPages) {
          setPage(payload.totalPages);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setResult({
          queryKey,
          status: "error",
          data: null,
          errorMessage:
            error instanceof Error && error.message
              ? error.message
              : "Could not load events.",
        });
      });

    return () => controller.abort();
  }, [queryKey, category, city, search, page]);

  const isPending = result?.queryKey !== queryKey;
  const data = result?.data ?? null;
  const hasError = !isPending && result?.status === "error";
  const errorMessage =
    result?.status === "error" ? result.errorMessage : "";

  const showSkeletons = isPending && !data;
  const isRefreshing = isPending && data !== null;
  const events = data?.events ?? [];
  const showEmpty =
    !hasError && data !== null && events.length === 0;
  const showGrid = !hasError && data !== null && events.length > 0;

  const hasActiveFilters = Boolean(category || city || searchInput.trim());

  const rangeStart = data ? (data.page - 1) * data.limit + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.limit, data.total) : 0;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setCity("");
    setPage(1);
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    document
      .getElementById("upcoming")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      id="upcoming"
      aria-labelledby="upcoming-heading"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">The full calendar</p>
          <h2
            id="upcoming-heading"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            Upcoming events
          </h2>
        </div>
        {data && !hasError && (
          <span className="inline-flex w-fit items-center rounded-full border border-ink/15 bg-cream px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-deep uppercase">
            {data.total === 1 ? "1 event" : `${data.total} events`}
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-ink/10 bg-cream p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search events</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-soft">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search events, cities..."
            className="input h-12 rounded-full !pr-4 !pl-11 !bg-white"
          />
        </label>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Filter by category"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              aria-pressed={category === ""}
              className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
                category === ""
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 bg-white text-slate-deep hover:border-clay hover:text-clay"
              }`}
            >
              All
            </button>
            {EVENT_CATEGORIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCategory(value);
                  setPage(1);
                }}
                aria-pressed={category === value}
                className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
                  category === value
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 bg-white text-slate-deep hover:border-clay hover:text-clay"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="block w-full sm:w-auto">
              <span className="sr-only">Filter by city</span>
              <select
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setPage(1);
                }}
                className="input h-10 w-full rounded-full appearance-none !pr-8 !bg-white sm:w-44"
              >
                <option value="">All cities</option>
                {(data?.cities ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="btn btn-outline !h-10 !px-4 !text-xs"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {showSkeletons && (
        <ul
          aria-hidden="true"
          className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </ul>
      )}

      {hasError && (
        <div className="mt-10 rounded-3xl border border-clay/30 bg-clay-soft px-6 py-14 text-center">
          <h3 className="font-display text-xl font-semibold text-ink">
            Could not load events
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-clay-deep">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="btn btn-ink mt-6"
          >
            Try again
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="mt-10 rounded-3xl border border-dashed border-ink/25 bg-white px-6 py-14 text-center">
          <h3 className="font-display text-xl font-semibold text-ink">
            No events found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-deep/80">
            Try a different search, or clear your filters to see everything
            coming up.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="btn btn-outline mt-6"
          >
            Clear filters
          </button>
        </div>
      )}

      {showGrid && data && (
        <>
          <ul
            aria-busy={isRefreshing}
            className={`mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
              isRefreshing ? "opacity-60" : ""
            }`}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-soft">
              Showing {rangeStart}–{rangeEnd} of {data.total} event
              {data.total === 1 ? "" : "s"}
            </p>

            {data.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page <= 1 || isRefreshing}
                  className="btn btn-outline !h-10 !px-4 !text-sm"
                >
                  <ChevronLeftIcon />
                  Previous
                </button>
                <span className="px-2 text-sm font-medium text-slate-deep">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(Math.min(data.totalPages, page + 1))}
                  disabled={page >= data.totalPages || isRefreshing}
                  className="btn btn-outline !h-10 !px-4 !text-sm"
                >
                  Next
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
