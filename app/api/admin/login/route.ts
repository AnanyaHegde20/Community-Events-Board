import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ADMIN_SESSION_COOKIE,
  signAdminSessionToken,
  adminSessionCookieOptions,
} from "@/lib/auth";
import { firstIssue, adminLoginSchema } from "@/lib/validation";

const INVALID_CREDENTIALS_ERROR = "Invalid admin email or password.";

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

    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      const issue = firstIssue(parsed.error);
      return Response.json(
        { error: issue.message, field: issue.field },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      console.error(
        "POST /api/admin/login failed: ADMIN_EMAIL or ADMIN_PASSWORD_HASH is not set.",
      );
      return Response.json(
        { error: "Admin sign-in is not configured." },
        { status: 503 },
      );
    }

    const validEmail = email === adminEmail.toLowerCase();
    const validPassword = await bcrypt.compare(password, adminPasswordHash);

    if (!validEmail || !validPassword) {
      return Response.json({ error: INVALID_CREDENTIALS_ERROR }, { status: 401 });
    }

    const token = await signAdminSessionToken(adminEmail);

    const response = NextResponse.json(
      { admin: { email: adminEmail, role: "admin" } },
      { status: 200 },
    );
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      adminSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("POST /api/admin/login failed:", error);
    return Response.json(
      { error: "Unable to sign in as admin. Please try again later." },
      { status: 500 },
    );
  }
}
