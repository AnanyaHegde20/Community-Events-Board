import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { MyFeed } from "@/components/my-feed";

export const metadata: Metadata = {
  title: "My Feed",
};

// This page reads the session cookie on every request, so it can never be
// prerendered into a static shell. Keep it a blocking dynamic route.
export const instant = false;

export default async function FeedPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims || claims.role !== "user") {
    redirect("/login");
  }

  return <MyFeed />;
}
