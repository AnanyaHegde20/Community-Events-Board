"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiError = {
  error?: string;
  field?: string | null;
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setErrorField(null);

    if (name.trim().length < 2) {
      setErrorField("name");
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!email.trim()) {
      setErrorField("email");
      setError("Email is required.");
      return;
    }
    if (password.length < 8) {
      setErrorField("password");
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as ApiError | null;

      if (!response.ok) {
        setErrorField(data?.field ?? null);
        setError(data?.error ?? "Unable to create your account.");
        return;
      }

      // Signup sets the session cookie, so go straight to the homepage.
      router.push("/");
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Join Community Events to save favourites and register for events.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errorField === "name"}
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
              placeholder="Your name"
            />
          </div>

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
              aria-invalid={errorField === "email"}
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={errorField === "password"}
              className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
              placeholder="At least 8 characters"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Must be at least 8 characters.
            </p>
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-violet-700 hover:text-violet-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
