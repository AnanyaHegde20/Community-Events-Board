import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";

const reminderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
  },
  { timestamps: true },
);

// One reminder per user per event. The unique compound index is what makes
// concurrent "Remind me" clicks safe: a racing duplicate insert fails at the
// database level instead of creating a second row.
reminderSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export type ReminderDocument = InferSchemaType<typeof reminderSchema>;

export const Reminder: Model<ReminderDocument> =
  (models.Reminder as Model<ReminderDocument> | undefined) ??
  model<ReminderDocument>("Reminder", reminderSchema);
