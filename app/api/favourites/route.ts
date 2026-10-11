import type { NextRequest } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { allIssues, favouritesUpdateSchema } from "@/lib/validation";
import { User } from "@/models/user";
import type { FavouritesResponse } from "@/types/events";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const response: FavouritesResponse = {
      favouriteCategories: user.favouriteCategories,
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/favourites failed:", error);
    return Response.json(
      { error: "Unable to load favourites. Please try again later." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = favouritesUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const issues = allIssues(parsed.error);
      const first = issues[0];
      return Response.json(
        {
          error: first?.message ?? "Invalid input.",
          field: first?.field ?? null,
          issues,
        },
        { status: 400 },
      );
    }

    // Remove duplicates while preserving the submitted order.
    const favouriteCategories = [...new Set(parsed.data.favouriteCategories)];

    await connectToDatabase();

    // Updates only the authenticated user's document — the id comes from the
    // verified session, never from the request body.
    const updated = await User.findByIdAndUpdate(
      user.id,
      { favouriteCategories },
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return Response.json(
        { error: "You must be signed in to do that." },
        { status: 401 },
      );
    }

    const response: FavouritesResponse = {
      favouriteCategories,
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("PUT /api/favourites failed:", error);
    return Response.json(
      { error: "Unable to save favourites. Please try again later." },
      { status: 500 },
    );
  }
}
