import { NextRequest } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return Response.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/auth/me failed:", error);
    return Response.json(
      { error: "Unable to load your profile." },
      { status: 500 },
    );
  }
}
