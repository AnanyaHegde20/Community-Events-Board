import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  USER_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin dashboard",
};

// The dashboard is per-request and cookie-protected, so it can never be
// prerendered into a static shell. Keep it a blocking dynamic route.
export const instant = false;

export default async function AdminPage() {
  const cookieStore = await cookies();

  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const adminClaims = adminToken
    ? await verifySessionToken(adminToken)
    : null;

  if (adminClaims && adminClaims.role === "admin") {
    return <AdminDashboard adminEmail={adminClaims.email} />;
  }

  // An ordinary user session is a valid identity but not an admin:
  // reject it explicitly instead of bouncing to the admin sign-in form.
  const userToken = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const userClaims = userToken ? await verifySessionToken(userToken) : null;

  if (userClaims && userClaims.role === "user") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-sm">
          <p className="eyebrow text-clay">Admins only</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-deep/80">
            You are signed in as a regular user. This area is restricted to
            Community Events administrators.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/"
              className="h-11 rounded-full bg-clay text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clay-deep"
            >
              Back to home
            </Link>
            <Link
              href="/admin/login"
              className="h-11 rounded-full border border-zinc-300 bg-white text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-clay/50 hover:text-clay-deep"
            >
              Sign in as admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No usable session at all — send to the admin sign-in page.
  redirect("/admin/login");
}
