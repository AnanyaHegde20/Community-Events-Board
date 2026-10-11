import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";
import { CARD_STICKERS, CARD_THEMES } from "@/lib/card-designs";

const cardDesignSchema = new Schema(
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
    theme: {
      type: String,
      required: true,
      enum: {
        values: [...CARD_THEMES],
        message: "Theme must be one of: classic, vibrant, minimal.",
      },
    },
    stickers: {
      type: [String],
      enum: {
        values: [...CARD_STICKERS],
        message:
          "Stickers must be one of: star, heart, music, sparkles, party.",
      },
      default: [],
    },
  },
  { timestamps: true },
);

// One saved design per user per event. The unique compound index makes
// concurrent saves safe: a racing duplicate insert fails at the database
// level instead of creating a second design document.
cardDesignSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export type CardDesignDocument = InferSchemaType<typeof cardDesignSchema>;

export const CardDesign: Model<CardDesignDocument> =
  (models.CardDesign as Model<CardDesignDocument> | undefined) ??
  model<CardDesignDocument>("CardDesign", cardDesignSchema);
