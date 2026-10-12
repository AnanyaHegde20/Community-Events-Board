"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { EventForm } from "@/components/admin/event-form";
import type {
  AdminEventListItem,
  AdminEventsApiResponse,
} from "@/types/events";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatPrice(price: number): string {
  if (price <= 0) return "Free";
  return inrFormatter.format(price);
}

function formatEventDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const day = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
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
  data: AdminEventsApiResponse | null;
  errorMessage: string;
};

type Notice = { tone: "success" | "error"; message: string } | null;

type FormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; event: AdminEventListItem };

type MutationResult = {
  status: number;
  body: { error?: string } | null;
};

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const queryKey = useMemo(
    () => JSON.stringify({ category, status, search, page, reloadKey }),
    [category, status, search, page, reloadKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    fetch(`/api/admin/events?${params.toString()}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          router.push("/admin/login");
          throw new Error("Your admin session has expired.");
        }

        const payload = (await response.json().catch(() => null)) as Partial<
          AdminEventsApiResponse
        > & { error?: string };

        if (!response.ok || !Array.isArray(payload.events)) {
          throw new Error(payload.error ?? "Could not load events.");
        }

        return payload as AdminEventsApiResponse;
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
  }, [queryKey, category, status, search, page, router]);

  const isPending = result?.queryKey !== queryKey;
  const data = result?.data ?? null;
  const hasError = !isPending && result?.status === "error";
  const errorMessage =
    result?.status === "error" ? result.errorMessage : "";

  const showSkeletons = isPending && !data;
  const isRefreshing = isPending && data !== null;
  const events = data?.events ?? [];
  const showEmpty = !hasError && data !== null && events.length === 0;
  const showTable = !hasError && data !== null && events.length > 0;

  const hasActiveFilters = Boolean(category || status || searchInput.trim());

  const rangeStart = data ? (data.page - 1) * data.limit + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.limit, data.total) : 0;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
  }

  function reload() {
    setNotice(null);
    setReloadKey((key) => key + 1);
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleSaved(message: string) {
    setFormMode({ kind: "closed" });
    setNotice({ tone: "success", message });
    setReloadKey((key) => key + 1);
  }

  async function toggleStatus(
    event: AdminEventListItem,
  ): Promise<MutationResult> {
    const response = await fetch(`/api/admin/events/${event.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ isActive: !event.isActive }),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return { status: response.status, body };
  }

  async function handleToggleStatus(event: AdminEventListItem) {
    if (pendingStatusId) return;
    setPendingStatusId(event.id);
    setNotice(null);
    try {
      const { status: responseStatus, body } = await toggleStatus(event);
      if (responseStatus === 401 || responseStatus === 403) {
        router.push("/admin/login");
        return;
      }
      if (responseStatus !== 200) {
        setNotice({
          tone: "error",
          message: body?.error ?? "Unable to update the event status.",
        });
        return;
      }
      setNotice({
        tone: "success",
        message: event.isActive
          ? `"${event.title}" deactivated. It is hidden from the public page.`
          : `"${event.title}" activated. It is visible on the public page again.`,
      });
      setReloadKey((key) => key + 1);
    } catch {
      setNotice({
        tone: "error",
        message: "Something went wrong. Check your connection and try again.",
      });
    } finally {
      setPendingStatusId(null);
    }
  }

  const summary = data?.summary;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-clay">Manage the board</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-soft">
            Signed in as <span className="font-medium">{adminEmail}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFormMode({ kind: "create" })}
            className="h-10 rounded-full bg-clay px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
          >
            Add event
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-10 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep disabled:opacity-60"
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <dt className="text-sm font-medium text-zinc-500">Total events</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            {summary ? summary.total : "—"}
          </dd>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <dt className="text-sm font-medium text-emerald-800">
            Active events
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-emerald-900">
            {summary ? summary.active : "—"}
          </dd>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 shadow-sm">
          <dt className="text-sm font-medium text-zinc-600">
            Inactive events
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-700">
            {summary ? summary.inactive : "—"}
          </dd>
        </div>
      </dl>

      {notice && (
        <div
          role="status"
          className={`mt-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="shrink-0 font-medium opacity-70 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search events</span>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title, description, city..."
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-clay focus:ring-2 focus:ring-clay/30 focus:outline-none"
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
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-clay focus:ring-2 focus:ring-clay/30 focus:outline-none"
          >
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="sm:w-40">
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-clay focus:ring-2 focus:ring-clay/30 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-clay/50 hover:text-clay-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>

      {showSkeletons && (
        <div
          aria-hidden="true"
          className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        >
          <div className="h-11 animate-pulse border-b border-zinc-200 bg-zinc-50" />
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse border-b border-zinc-100 last:border-b-0"
            />
          ))}
        </div>
      )}

      {hasError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-red-900">
            Could not load events
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-6 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
          >
            Try again
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-zinc-900">
            {hasActiveFilters ? "No events found" : "No events yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            {hasActiveFilters
              ? "Try a different search, or clear your filters to see all events."
              : "Create your first event to get the board started."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep"
            >
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFormMode({ kind: "create" })}
              className="mt-6 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
            >
              Add event
            </button>
          )}
        </div>
      )}

      {showTable && data && (
        <>
          <div
            aria-busy={isRefreshing}
            className={`mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm ${
              isRefreshing ? "opacity-60" : ""
            }`}
          >
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th scope="col" className="px-4 py-3">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    City
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date &amp; time
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                  >
                    <td className="max-w-[220px] px-4 py-3">
                      <span
                        className="block truncate font-medium text-zinc-900"
                        title={event.title}
                      >
                        {event.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-clay-soft px-2.5 py-0.5 text-xs font-medium text-clay-deep">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{event.city}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {formatEventDateTime(event.dateTime)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-900">
                      {formatPrice(event.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          event.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setFormMode({ kind: "edit", event })
                          }
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-clay/50 hover:text-clay-deep"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(event)}
                          disabled={pendingStatusId !== null}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            event.isActive
                              ? "border-zinc-300 bg-white text-zinc-700 hover:border-amber-300 hover:text-amber-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                          }`}
                        >
                          {pendingStatusId === event.id
                            ? "Updating..."
                            : event.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
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

      {formMode.kind !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={
            formMode.kind === "edit" ? "Edit event" : "Add event"
          }
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              {formMode.kind === "edit" ? "Edit event" : "Add event"}
            </h2>
            <div className="mt-5">
              <EventForm
                initialEvent={formMode.kind === "edit" ? formMode.event : null}
                onCancel={() => setFormMode({ kind: "closed" })}
                onSaved={handleSaved}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
