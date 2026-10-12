"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventCard, EventCardSkeleton } from "@/components/event-card";
import type { FeedApiResponse } from "@/types/events";

const PAGE_SIZE = 12;

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
  data: FeedApiResponse | null;
  errorMessage: string;
};

export function MyFeed() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const queryKey = useMemo(
    () => JSON.stringify({ page, reloadKey }),
    [page, reloadKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    fetch(`/api/feed?${params.toString()}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          throw new Error("You must be signed in to view your feed.");
        }

        const payload = (await response.json().catch(() => null)) as Partial<
          FeedApiResponse
        > & { error?: string };

        if (!response.ok || !Array.isArray(payload.events)) {
          throw new Error(payload.error ?? "Could not load your feed.");
        }

        return payload as FeedApiResponse;
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
              : "Could not load your feed.",
        });
      });

    return () => controller.abort();
  }, [queryKey, page, router]);

  const isPending = result?.queryKey !== queryKey;
  const data = result?.data ?? null;
  const hasError = !isPending && result?.status === "error";
  const errorMessage =
    result?.status === "error" ? result.errorMessage : "";

  const showSkeletons = isPending && !data;
  const isRefreshing = isPending && data !== null;
  const events = data?.events ?? [];
  const showEmptyFeed = !hasError && data !== null && events.length === 0;
  const showGrid = !hasError && data !== null && events.length > 0;

  const rangeStart = data ? (data.page - 1) * data.limit + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.limit, data.total) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">Just for you</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            My Feed
          </h1>
          <p className="mt-2 max-w-xl text-base leading-7 text-slate-deep/80">
            Upcoming events from the categories you love, sorted by the nearest
            date first.
          </p>
        </div>
        {data && !hasError && (
          <span className="inline-flex w-fit items-center rounded-full border border-ink/15 bg-cream px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-deep uppercase">
            {data.total === 1 ? "1 event" : `${data.total} events`}
          </span>
        )}
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
          <h2 className="text-base font-semibold text-red-900">
            Could not load your feed
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-6 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
          >
            Try again
          </button>
        </div>
      )}

      {showEmptyFeed && (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-zinc-900">
            No events to show yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            We could not find any upcoming events in your favourite categories.
            Try adding more categories, or check back soon — new gatherings are
            posted all the time.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/preferences"
              className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
            >
              Update preferences
            </Link>
            <Link
              href="/#upcoming"
              className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep"
            >
              Browse all events
            </Link>
          </div>
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
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1 || isRefreshing}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon />
                  Previous
                </button>
                <span className="px-2 text-sm text-zinc-600">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                  disabled={page >= data.totalPages || isRefreshing}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRightIcon />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
