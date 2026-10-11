import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import {
  USER_SESSION_COOKIE,
  signUserSessionToken,
  userSessionCookieOptions,
} from "@/lib/auth";
import { firstIssue, loginSchema } from "@/lib/validation";

const INVALID_CREDENTIALS_ERROR = "Invalid email or password.";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      return Response.json(
        { error: issue.message, field: issue.field },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email })
      .select("+passwordHash")
      .lean();

    // Generic error for both unknown email and wrong password.
    if (!user || !user.passwordHash) {
      return Response.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return Response.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
    }

    const token = await signUserSessionToken(String(user._id), user.email);
    const safeUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      favouriteCategories: user.favouriteCategories ?? [],
    };

    const response = NextResponse.json({ user: safeUser }, { status: 200 });
    response.cookies.set(USER_SESSION_COOKIE, token, userSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return Response.json(
      { error: "Unable to sign you in. Please try again later." },
      { status: 500 },
    );
  }
}
