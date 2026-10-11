import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { AuthError, requireAdmin } from "@/lib/auth";
import {
  allIssues,
  eventIdSchema,
  eventStatusSchema,
} from "@/lib/validation";
import { toAdminEventListItem } from "@/lib/admin-events";
import { Event } from "@/models/event";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);

    const { id } = await context.params;

    const idParsed = eventIdSchema.safeParse(id);
    if (!idParsed.success) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = eventStatusSchema.safeParse(body);
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

    await connectToDatabase();

    // Only flips isActive — the event record is never deleted.
    const event = await Event.findByIdAndUpdate(
      idParsed.data,
      { isActive: parsed.data.isActive },
      { new: true, runValidators: true },
    ).lean();

    if (!event) {
      return Response.json({ error: "Event not found." }, { status: 404 });
    }

    return Response.json(
      { event: toAdminEventListItem(event) },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof mongoose.Error.CastError) {
      return Response.json({ error: "Invalid event ID." }, { status: 400 });
    }

    console.error("PATCH /api/admin/events/[id]/status failed:", error);
    return Response.json(
      { error: "Unable to update the event status. Please try again later." },
      { status: 500 },
    );
  }
}
