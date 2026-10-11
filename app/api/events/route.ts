import type { NextRequest } from "next/server";
import type { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/event-categories";
import { Event, type EventDocument } from "@/models/event";
import type { EventListItem, EventsApiResponse } from "@/types/events";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 24;
const MAX_PAGE = 10_000;
const MAX_TEXT_LENGTH = 100;

class InvalidParamError extends Error {}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readTextParam(
  params: URLSearchParams,
  name: string,
): string | null {
  const raw = params.get(name);
  if (raw === null) return null;

  const value = raw.trim();
  if (value === "") return null;

  if (value.length > MAX_TEXT_LENGTH) {
    throw new InvalidParamError(
      `"${name}" must be at most ${MAX_TEXT_LENGTH} characters.`,
    );
  }

  return value;
}

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
    const params = request.nextUrl.searchParams;

    const category = readTextParam(params, "category");
    const city = readTextParam(params, "city");
    const search = readTextParam(params, "search");
    const page = readPositiveIntParam(params, "page") ?? 1;
    const requestedLimit = readPositiveIntParam(params, "limit") ?? DEFAULT_LIMIT;

    if (page > MAX_PAGE) {
      throw new InvalidParamError(`"page" must be at most ${MAX_PAGE}.`);
    }

    let validCategory: EventCategory | null = null;
    if (category) {
      const match = EVENT_CATEGORIES.find((value) => value === category);
      if (!match) {
        throw new InvalidParamError(
          `Invalid category. Allowed values: ${EVENT_CATEGORIES.join(", ")}.`,
        );
      }
      validCategory = match;
    }

    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const now = new Date();

    await connectToDatabase();

    const filter: QueryFilter<EventDocument> = {
      isActive: true,
      dateTime: { $gt: now },
    };

    if (validCategory) {
      filter.category = validCategory;
    }

    if (city) {
      filter.city = { $regex: escapeRegExp(city), $options: "i" };
    }

    if (search) {
      const pattern = { $regex: escapeRegExp(search), $options: "i" };
      filter.$or = [
        { title: pattern },
        { description: pattern },
        { city: pattern },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, docs, cities] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort({ dateTime: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.distinct("city", { isActive: true, dateTime: { $gt: now } }),
    ]);

    const events: EventListItem[] = docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      category: doc.category as EventCategory,
      city: doc.city,
      dateTime: doc.dateTime.toISOString(),
      price: doc.price,
      description: doc.description,
      imageUrl: doc.imageUrl,
    }));

    const response: EventsApiResponse = {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      cities: [...cities].sort((a, b) => a.localeCompare(b)),
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof InvalidParamError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("GET /api/events failed:", error);
    return Response.json(
      { error: "Unable to fetch events. Please try again later." },
      { status: 500 },
    );
  }
}
