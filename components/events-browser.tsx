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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="upcoming-heading"
            className="text-3xl font-semibold tracking-tight text-zinc-900"
          >
            Upcoming events
          </h2>
          <p className="mt-2 max-w-xl text-base leading-7 text-zinc-600">
            Browse meetups, workshops and gatherings from communities across
            India.
          </p>
        </div>
        {data && !hasError && (
          <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
            {data.total === 1 ? "1 event" : `${data.total} events`}
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search events</span>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search events, cities..."
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
          />
        </label>

        <label className="sm:w-44">
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
          >
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="sm:w-44">
          <span className="sr-only">Filter by city</span>
          <select
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
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
          className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
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
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-red-900">
            Could not load events
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-6 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
          >
            Try again
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-zinc-900">
            No events found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Try a different search, or clear your filters to see everything
            coming up.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="mt-6 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
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
            <p className="text-sm text-zinc-500">
              Showing {rangeStart}–{rangeEnd} of {data.total} event
              {data.total === 1 ? "" : "s"}
            </p>

            {data.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page <= 1 || isRefreshing}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon />
                  Previous
                </button>
                <span className="px-2 text-sm text-zinc-600">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(Math.min(data.totalPages, page + 1))}
                  disabled={page >= data.totalPages || isRefreshing}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
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
