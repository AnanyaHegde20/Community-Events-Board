import { z } from "zod";
import {
  CARD_STICKERS,
  CARD_THEMES,
  MAX_CARD_STICKERS,
} from "@/lib/card-designs";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email must be at most 254 characters.")
  .pipe(z.email("Enter a valid email address."))
  .transform((value) => value.toLowerCase());

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.");

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters."),
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must be at most 128 characters."),
});

export const adminLoginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must be at most 128 characters."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const favouriteCategoriesSchema = z
  .array(z.enum(EVENT_CATEGORIES))
  .max(EVENT_CATEGORIES.length)
  .optional();

export const favouritesUpdateSchema = z.object({
  favouriteCategories: z.array(
    z.enum(EVENT_CATEGORIES, {
      error: "Category must be one of: Music, Workshop, Food, Sports, Kids.",
    }),
    { error: "favouriteCategories must be an array of categories." },
  ),
});

export type FavouritesUpdateInput = z.infer<typeof favouritesUpdateSchema>;

const eventTitleField = z
  .string("Title is required.")
  .trim()
  .min(3, "Title must be at least 3 characters.")
  .max(120, "Title must be at most 120 characters.");

const eventCategoryField = z.enum(EVENT_CATEGORIES, {
  error: "Category must be one of: Music, Workshop, Food, Sports, Kids.",
});

const eventCityField = z
  .string("City is required.")
  .trim()
  .min(2, "City must be at least 2 characters.")
  .max(80, "City must be at most 80 characters.");

const eventDateTimeField = z
  .string("Date and time is required.")
  .trim()
  .min(1, "Date and time is required.")
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Enter a valid date and time.",
  )
  .transform((value) => new Date(value));

const eventPriceField = z
  .number("Price is required.")
  .min(0, "Price cannot be negative.");

const eventDescriptionField = z
  .string("Description is required.")
  .trim()
  .min(10, "Description must be at least 10 characters.")
  .max(2000, "Description must be at most 2000 characters.");

const eventImageUrlField = z
  .string("Image URL is required.")
  .trim()
  .min(1, "Image URL is required.")
  .max(2048, "Image URL must be at most 2048 characters.")
  .refine(
    (value) => /^https?:\/\/\S+$/.test(value),
    "Image URL must be a valid http(s) URL.",
  );

const eventBaseSchema = z.object({
  title: eventTitleField,
  category: eventCategoryField,
  city: eventCityField,
  dateTime: eventDateTimeField,
  price: eventPriceField,
  description: eventDescriptionField,
  imageUrl: eventImageUrlField,
});

export const eventCreateSchema = eventBaseSchema.extend({
  isActive: z.boolean().default(true),
});

export const eventUpdateSchema = eventBaseSchema
  .extend({
    isActive: z.boolean().optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "Provide at least one field to update.",
  });

export const eventStatusSchema = z.object({
  isActive: z.boolean("Active status is required."),
});

export const reminderUpdateSchema = z.object({
  enabled: z.boolean("enabled must be a boolean."),
});

export const cardDesignUpdateSchema = z.object({
  theme: z.enum(CARD_THEMES, {
    error: "Theme must be one of: classic, vibrant, minimal.",
  }),
  stickers: z
    .array(
      z.enum(CARD_STICKERS, {
        error: "Sticker must be one of: star, heart, music, sparkles, party.",
      }),
      { error: "stickers must be an array of stickers." },
    )
    .max(MAX_CARD_STICKERS, {
      error: `You can select at most ${MAX_CARD_STICKERS} stickers.`,
    })
    .refine((stickers) => new Set(stickers).size === stickers.length, {
      error: "Each sticker can only be selected once.",
    }),
});

export const eventIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid event ID.");

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventStatusInput = z.infer<typeof eventStatusSchema>;
export type ReminderUpdateInput = z.infer<typeof reminderUpdateSchema>;
export type CardDesignUpdateInput = z.infer<typeof cardDesignUpdateSchema>;

export type ValidationIssue = {
  field: string | null;
  message: string;
};

export function firstIssue(
  error: z.ZodError,
): ValidationIssue {
  const issue = error.issues[0];
  return {
    field: issue?.path?.length ? String(issue.path[0]) : null,
    message: issue?.message ?? "Invalid input.",
  };
}

export function allIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path?.length ? String(issue.path[0]) : null,
    message: issue.message ?? "Invalid input.",
  }));
}
