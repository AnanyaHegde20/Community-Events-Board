import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

export {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/event-categories";

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title must be at most 120 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [...EVENT_CATEGORIES],
        message: "Category must be one of: Music, Workshop, Food, Sports, Kids",
      },
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [80, "City must be at most 80 characters"],
    },
    dateTime: {
      type: Date,
      required: [true, "Date and time is required"],
      validate: {
        validator: (value: Date) =>
          value instanceof Date && !Number.isNaN(value.getTime()),
        message: "Date and time must be a valid date",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description must be at most 2000 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      validate: {
        validator: (value: string) => /^https?:\/\/\S+$/.test(value),
        message: "Image URL must be a valid http(s) URL",
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    seedId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

eventSchema.index({ category: 1 });
eventSchema.index({ city: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ dateTime: 1 });
eventSchema.index({ isActive: 1, dateTime: 1 });

export type EventDocument = InferSchemaType<typeof eventSchema>;

export const Event: Model<EventDocument> =
  (models.Event as Model<EventDocument> | undefined) ??
  model<EventDocument>("Event", eventSchema);
