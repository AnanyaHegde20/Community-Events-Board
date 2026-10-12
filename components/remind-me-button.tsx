"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LoadState = "loading" | "ready" | "error" | "signed-out";

type ReminderLoad =
  | { status: "signed-out" }
  | { status: "ready"; enabled: boolean };

function BellIcon() {
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
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    </svg>
  );
}

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
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

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
      <path
        d="M12 3a9 9 0 1 0 9 9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RemindMeButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [enabled, setEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    fetch(`/api/events/${eventId}/reminder`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response): Promise<ReminderLoad> => {
        if (response.status === 401) {
          return { status: "signed-out" };
        }

        const data = (await response.json().catch(() => null)) as {
          enabled?: unknown;
          error?: string;
        } | null;

        if (!response.ok || typeof data?.enabled !== "boolean") {
          throw new Error(data?.error ?? "Could not load your reminder.");
        }

        return { status: "ready", enabled: data.enabled };
      })
      .then((result) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        if (result.status === "signed-out") {
          setLoadState("signed-out");
          return;
        }

        setEnabled(result.enabled);
        setLoadState("ready");
      })
      .catch(() => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setLoadState("error");
      });

    return () => controller.abort();
  }, [eventId, reloadKey]);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (loadState === "loading" || isSaving) return;

    if (loadState === "signed-out") {
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
      return;
    }

    if (loadState === "error") {
      setSaveError(null);
      setLoadState("loading");
      setReloadKey((key) => key + 1);
      return;
    }

    const previous = enabled;
    const nextValue = !previous;

    // Optimistic update: flip the UI immediately, revert if the save fails.
    setEnabled(nextValue);
    setSaveError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/reminder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ enabled: nextValue }),
      });

      if (response.status === 401) {
        setEnabled(previous);
        setLoadState("signed-out");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        enabled?: unknown;
        error?: string;
      } | null;

      if (!response.ok || typeof data?.enabled !== "boolean") {
        throw new Error(data?.error ?? "Unable to update your reminder.");
      }

      setEnabled(data.enabled);
    } catch (error) {
      setEnabled(previous);
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to update your reminder.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep focus-visible:ring-2 focus-visible:ring-clay/50 focus-visible:outline-none"
        >
          Try again
        </button>
        <p role="alert" className="text-right text-xs leading-4 text-red-600">
          Could not load reminder.
        </p>
      </div>
    );
  }

  const isLoading = loadState === "loading";
  const isSaved = loadState === "ready" && enabled;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || isSaving}
        aria-pressed={loadState === "ready" ? enabled : undefined}
        aria-busy={isLoading || isSaving}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-clay/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
          isSaved
            ? "border border-clay/30 bg-clay-soft text-clay-deep hover:border-clay/50"
            : "border border-zinc-300 bg-white text-zinc-700 hover:border-clay/50 hover:text-clay-deep"
        }`}
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            Loading...
          </>
        ) : isSaving ? (
          <>
            <SpinnerIcon />
            Saving...
          </>
        ) : isSaved ? (
          <>
            <CheckIcon />
            Reminder saved
          </>
        ) : (
          <>
            <BellIcon />
            Remind me
          </>
        )}
      </button>

      {saveError && (
        <p role="alert" className="text-right text-xs leading-4 text-red-600">
          {saveError}
        </p>
      )}
    </div>
  );
}
