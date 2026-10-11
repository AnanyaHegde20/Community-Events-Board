import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/user";
import {
  USER_SESSION_COOKIE,
  signUserSessionToken,
  userSessionCookieOptions,
} from "@/lib/auth";
import { firstIssue, signupSchema } from "@/lib/validation";

const PASSWORD_HASH_ROUNDS = 10;

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

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      return Response.json(
        { error: issue.message, field: issue.field },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    await connectToDatabase();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return Response.json(
        {
          error: "An account with this email already exists.",
          field: "email",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    let created;
    try {
      created = await User.create({ name, email, passwordHash });
    } catch (error) {
      // Unique index race (duplicate email inserted concurrently).
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        return Response.json(
          {
            error: "An account with this email already exists.",
            field: "email",
          },
          { status: 409 },
        );
      }
      throw error;
    }

    const token = await signUserSessionToken(String(created._id), email);
    const safeUser = {
      id: String(created._id),
      name: created.name,
      email: created.email,
      favouriteCategories: created.favouriteCategories ?? [],
    };

    const response = NextResponse.json({ user: safeUser }, { status: 201 });
    response.cookies.set(USER_SESSION_COOKIE, token, userSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("POST /api/auth/signup failed:", error);
    return Response.json(
      { error: "Unable to create your account. Please try again later." },
      { status: 500 },
    );
  }
}
