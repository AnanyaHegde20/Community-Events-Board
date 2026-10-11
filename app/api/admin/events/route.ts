import type { NextRequest } from "next/server";
import type { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/event-categories";
import {
  AuthError,
  requireAdmin,
} from "@/lib/auth";
import {
  allIssues,
  eventCreateSchema,
} from "@/lib/validation";
import {
  escapeRegExp,
  toAdminEventListItem,
} from "@/lib/admin-events";
import { Event, type EventDocument } from "@/models/event";
import type {
  AdminEventsApiResponse,
  AdminEventsSummary,
} from "@/types/events";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;
const MAX_TEXT_LENGTH = 100;

class InvalidParamError extends Error {}

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
    await requireAdmin(request);

    const params = request.nextUrl.searchParams;

    const search = readTextParam(params, "search");
    const category = readTextParam(params, "category");
    const status = readTextParam(params, "status");
    const page = readPositiveIntParam(params, "page") ?? 1;
    const requestedLimit =
      readPositiveIntParam(params, "limit") ?? DEFAULT_LIMIT;

    if (page > MAX_PAGE) {
      throw new InvalidParamError(`"page" must be at most ${MAX_PAGE}.`);
    }

    if (status && status !== "active" && status !== "inactive") {
      throw new InvalidParamError(
        'Invalid status. Allowed values: active, inactive.',
      );
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

    const filter: QueryFilter<EventDocument> = {};

    if (validCategory) {
      filter.category = validCategory;
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
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

    await connectToDatabase();

    const [total, docs, activeCount, inactiveCount] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments({ isActive: true }),
      Event.countDocuments({ isActive: false }),
    ]);

    const summary: AdminEventsSummary = {
      total: activeCount + inactiveCount,
      active: activeCount,
      inactive: inactiveCount,
    };

    const response: AdminEventsApiResponse = {
      events: docs.map(toAdminEventListItem),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof InvalidParamError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("GET /api/admin/events failed:", error);
    return Response.json(
      { error: "Unable to fetch events. Please try again later." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = eventCreateSchema.safeParse(body);
    if (!parsed.success) {
      const issues = allIssues(parsed.error);
      const first = issues[0];
      return Response.json(
        { error: first?.message ?? "Invalid input.", field: first?.field ?? null, issues },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const event = await Event.create(parsed.data);

    return Response.json(
      { event: toAdminEventListItem(event.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/admin/events failed:", error);
    return Response.json(
      { error: "Unable to create the event. Please try again later." },
      { status: 500 },
    );
  }
}
