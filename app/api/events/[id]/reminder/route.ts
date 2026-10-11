import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { AuthError, requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  allIssues,
  eventIdSchema,
  reminderUpdateSchema,
} from "@/lib/validation";
import { Event } from "@/models/event";
import { Reminder } from "@/models/reminder";
import type { ReminderResponse } from "@/types/events";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const DUPLICATE_KEY_ERROR_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR_CODE
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser(request);

    const { id } = await context.params;

    const idParsed = eventIdSchema.safeParse(id);
    if (!idParsed.success) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }
    const eventId = idParsed.data;

    await connectToDatabase();

    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return Response.json({ error: "Event not found." }, { status: 404 });
    }

    const reminder = await Reminder.exists({ userId: user.id, eventId });

    const response: ReminderResponse = { enabled: reminder !== null };
    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof mongoose.Error.CastError) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }

    console.error("GET /api/events/[id]/reminder failed:", error);
    return Response.json(
      { error: "Unable to load your reminder. Please try again later." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser(request);

    const { id } = await context.params;

    const idParsed = eventIdSchema.safeParse(id);
    if (!idParsed.success) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }
    const eventId = idParsed.data;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = reminderUpdateSchema.safeParse(body);
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
    const { enabled } = parsed.data;

    await connectToDatabase();

    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return Response.json({ error: "Event not found." }, { status: 404 });
    }

    if (enabled) {
      try {
        // Atomic, idempotent upsert. Repeated or concurrent "enable" requests
        // for the same user + event cannot create duplicate reminders; a rare
        // racing insert surfaces as a duplicate-key error, which we treat as
        // success because the desired state already exists.
        await Reminder.updateOne(
          { userId: user.id, eventId },
          { $setOnInsert: { userId: user.id, eventId } },
          { upsert: true },
        );
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
    } else {
      // deleteOne is idempotent and the filter always includes the session
      // user's id, so one user can never remove another user's reminder.
      await Reminder.deleteOne({ userId: user.id, eventId });
    }

    const response: ReminderResponse = { enabled };
    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof mongoose.Error.CastError) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }

    console.error("PUT /api/events/[id]/reminder failed:", error);
    return Response.json(
      { error: "Unable to update your reminder. Please try again later." },
      { status: 500 },
    );
  }
}
