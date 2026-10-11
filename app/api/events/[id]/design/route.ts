import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import {
  DEFAULT_CARD_STICKERS,
  DEFAULT_CARD_THEME,
} from "@/lib/card-designs";
import { AuthError, requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  allIssues,
  cardDesignUpdateSchema,
  eventIdSchema,
} from "@/lib/validation";
import { CardDesign } from "@/models/card-design";
import { Event } from "@/models/event";
import type { CardDesignResponse } from "@/types/events";

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

function toDesignResponse(design: {
  theme?: string;
  stickers?: string[];
}): CardDesignResponse {
  return {
    theme: (design.theme as CardDesignResponse["theme"]) ?? DEFAULT_CARD_THEME,
    stickers: (design.stickers ?? []) as CardDesignResponse["stickers"],
  };
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

    const design = await CardDesign.findOne({ userId: user.id, eventId })
      .select("theme stickers")
      .lean();

    // Viewing a design must never create a record — when nothing is saved
    // yet, respond with the default design and leave the database untouched.
    const response: CardDesignResponse = design
      ? toDesignResponse(design)
      : { theme: DEFAULT_CARD_THEME, stickers: [...DEFAULT_CARD_STICKERS] };

    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof mongoose.Error.CastError) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }

    console.error("GET /api/events/[id]/design failed:", error);
    return Response.json(
      { error: "Unable to load your card design. Please try again later." },
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

    const parsed = cardDesignUpdateSchema.safeParse(body);
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
    const { theme, stickers } = parsed.data;

    await connectToDatabase();

    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return Response.json({ error: "Event not found." }, { status: 404 });
    }

    // The filter always includes the session user's id, so a design can only
    // ever be written to the authenticated user's own document.
    const filter = { userId: user.id, eventId };

    try {
      // Atomic, idempotent upsert keyed on the unique compound index.
      await CardDesign.updateOne(
        filter,
        {
          $set: { theme, stickers },
          $setOnInsert: { userId: user.id, eventId },
        },
        { upsert: true, runValidators: true },
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      // A concurrent save won the insert race; apply the same values as a
      // normal update so the user's intended design still lands.
      await CardDesign.updateOne(
        filter,
        { $set: { theme, stickers } },
        { runValidators: true },
      );
    }

    const response: CardDesignResponse = { theme, stickers };
    return Response.json(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof mongoose.Error.CastError) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }

    console.error("PUT /api/events/[id]/design failed:", error);
    return Response.json(
      { error: "Unable to save your card design. Please try again later." },
      { status: 500 },
    );
  }
}
