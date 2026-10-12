"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MeResponse = {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export function AuthMenu() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = (await response.json().catch(() => null)) as MeResponse | null;
        setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className="h-8 w-24 animate-pulse rounded-full bg-white/10"
      />
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        <Link
          href="/feed"
          className="rounded-full px-3 py-2 text-sm font-medium text-paper/75 transition-colors hover:text-paper"
        >
          My Feed
        </Link>
        <Link
          href="/preferences"
          className="rounded-full px-3 py-2 text-sm font-medium text-paper/75 transition-colors hover:text-paper"
        >
          Preferences
        </Link>
        <span className="hidden text-sm font-medium text-paper sm:inline">
          {user.name}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-paper transition-colors hover:border-clay hover:text-clay disabled:opacity-60"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full px-3 py-2 text-sm font-medium text-paper/75 transition-colors hover:text-paper"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="btn btn-primary !px-4 !py-2 !text-xs"
      >
        Sign up
      </Link>
    </div>
  );
}
