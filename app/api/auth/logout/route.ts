import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE, userSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Re-issue the cookie as expired so browsers delete it immediately.
  response.cookies.set(USER_SESSION_COOKIE, "", {
    ...userSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
