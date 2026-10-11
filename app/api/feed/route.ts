import type { NextRequest } from "next/server";
import type { QueryFilter } from "mongoose";
import { AuthError, requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Event, type EventDocument } from "@/models/event";
import type { EventListItem, FeedApiResponse } from "@/types/events";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const MAX_PAGE = 10_000;

class InvalidParamError extends Error {}

function readPositiveIntParam(
  params: URLSearchParams,
  name: string,
): number | null {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return null;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new InvalidParamError(`"${name}" must be a positive whole number.`);
  }

  return value;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const params = request.nextUrl.searchParams;

    const page = readPositiveIntParam(params, "page") ?? 1;
    const requestedLimit =
      readPositiveIntParam(params, "limit") ?? DEFAULT_LIMIT;

    if (page > MAX_PAGE) {
      throw new InvalidParamError(`"page" must be at most ${MAX_PAGE}.`);
    }

    const limit = Math.min(requestedLimit, MAX_LIMIT);

    const favouriteCategories = user.favouriteCategories;

    // No categories selected: return an empty page rather than unrelated events.
    if (favouriteCategories.length === 0) {
      const response: FeedApiResponse = {
        events: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
      return Response.json(response);
    }

    await connectToDatabase();

    const now = new Date();

    const filter: QueryFilter<EventDocument> = {
      isActive: true,
      dateTime: { $gt: now },
      category: { $in: favouriteCategories },
    };

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort({ dateTime: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const events: EventListItem[] = docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      category: doc.category as EventListItem["category"],
      city: doc.city,
      dateTime: doc.dateTime.toISOString(),
      price: doc.price,
      description: doc.description,
      imageUrl: doc.imageUrl,
    }));

    const response: FeedApiResponse = {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof InvalidParamError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("GET /api/feed failed:", error);
    return Response.json(
      { error: "Unable to load your feed. Please try again later." },
      { status: 500 },
    );
  }
}
