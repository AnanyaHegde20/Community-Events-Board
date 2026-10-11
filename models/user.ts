import { Schema, model, models } from "mongoose";
import type { InferSchemaType, Model } from "mongoose";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name must be at most 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email must be at most 254 characters"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    favouriteCategories: {
      type: [String],
      enum: {
        values: [...EVENT_CATEGORIES],
        message: "Favourite categories must be valid event categories",
      },
      default: [],
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>("User", userSchema);
