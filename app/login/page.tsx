"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiError = {
  error?: string;
  field?: string | null;
};

/**
 * Only allow same-site absolute paths (e.g. "/feed?page=2") as return
 * destinations. Blocks protocol-relative ("//evil.com") and backslash
 * tricks that could escape the site.
 */
function isSafeReturnPath(value: string | null): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  return true;
}

function resolvePostLoginPath(): string {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return isSafeReturnPath(next) ? next : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setFieldError(null);

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }
    if (!password) {
      setFieldError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await response.json().catch(() => null)) as ApiError | null;

      if (!response.ok) {
        setFieldError(data?.field === "email" ? "email" : null);
        setError(data?.error ?? "Unable to sign in. Please try again.");
        return;
      }

      router.push(resolvePostLoginPath());
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in to your Community Events account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={fieldError === "email"}
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={fieldError === "password"}
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-full bg-violet-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-violet-700 hover:text-violet-800"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
