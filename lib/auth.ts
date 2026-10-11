import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import type { EventCategory } from "@/lib/event-categories";

export const USER_SESSION_COOKIE = "ceb_user_session";
export const ADMIN_SESSION_COOKIE = "ceb_admin_session";

const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const JWT_ALGORITHM = "HS256";

export type SessionRole = "user" | "admin";

export type SessionClaims = {
  sub: string;
  role: SessionRole;
  email: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  favouriteCategories: EventCategory[];
};

export type AdminIdentity = {
  email: string;
  role: "admin";
};

export class AuthError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Add it to .env.local (see .env.example).",
    );
  }

  return new TextEncoder().encode(secret);
}

export function isSecureCookieEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

async function signSessionToken(
  claims: SessionClaims,
  maxAgeSeconds: number,
): Promise<string> {
  return new SignJWT({ role: claims.role, email: claims.email })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(getJwtSecret());
}

export async function signUserSessionToken(userId: string, email: string) {
  return signSessionToken(
    { sub: userId, role: "user", email },
    USER_SESSION_MAX_AGE_SECONDS,
  );
}

export async function signAdminSessionToken(adminEmail: string) {
  return signSessionToken(
    { sub: `admin:${adminEmail}`, role: "admin", email: adminEmail },
    ADMIN_SESSION_MAX_AGE_SECONDS,
  );
}

export async function verifySessionToken(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function buildSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookieEnv(),
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function userSessionCookieOptions() {
  return buildSessionCookieOptions(USER_SESSION_MAX_AGE_SECONDS);
}

export function adminSessionCookieOptions() {
  return buildSessionCookieOptions(ADMIN_SESSION_MAX_AGE_SECONDS);
}

export function getUserSessionToken(
  request: NextRequest,
): string | undefined {
  return request.cookies.get(USER_SESSION_COOKIE)?.value;
}

export function getAdminSessionToken(
  request: NextRequest,
): string | undefined {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
}

/**
 * Resolves the authenticated regular user for a request.
 * Loads the user from the database so responses always reflect current data.
 */
export async function getSessionUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const token = getUserSessionToken(request);
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims || claims.role !== "user") return null;

  const { connectToDatabase } = await import("@/lib/db");
  const { User } = await import("@/models/user");

  await connectToDatabase();
  const user = await User.findById(claims.sub).lean();

  if (!user) return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    favouriteCategories: (user.favouriteCategories ?? []) as EventCategory[],
  };
}

/**
 * Throws 401 when there is no valid user session.
 * Use inside route handlers to protect user-specific endpoints.
 */
export async function requireUser(request: NextRequest): Promise<SessionUser> {
  let user: SessionUser | null;
  try {
    user = await getSessionUser(request);
  } catch {
    throw new AuthError(500, "Unable to verify your session.");
  }

  if (!user) {
    throw new AuthError(401, "You must be signed in to do that.");
  }

  return user;
}

/**
 * Throws 401 for a missing/invalid admin session and 403 when the caller is
 * an authenticated non-admin. Never trusts client-supplied role data.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<AdminIdentity> {
  const token = getAdminSessionToken(request);

  if (token) {
    const claims = await verifySessionToken(token);
    if (claims && claims.role === "admin") {
      return { email: claims.email, role: "admin" };
    }
  }

  const userToken = getUserSessionToken(request);
  if (userToken) {
    const userClaims = await verifySessionToken(userToken);
    if (userClaims && userClaims.role === "user") {
      throw new AuthError(403, "Admin access is required.");
    }
  }

  throw new AuthError(401, "Admin authentication is required.");
}
