"use client";

import { useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import {
  allIssues,
  eventCreateSchema,
  eventUpdateSchema,
  type ValidationIssue,
} from "@/lib/validation";
import type { AdminEventListItem } from "@/types/events";

type EventFormProps = {
  initialEvent: AdminEventListItem | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

type FieldErrors = Partial<Record<string, string>>;

type ApiErrorBody = {
  error?: string;
  field?: string | null;
  issues?: ValidationIssue[];
};

function toDateTimeLocalValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") +
    "T" +
    [pad(date.getHours()), pad(date.getMinutes())].join(":");
}

function issuesToFieldErrors(issues: ValidationIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    if (issue.field && !errors[issue.field]) {
      errors[issue.field] = issue.message;
    }
  }
  return errors;
}

const inputClassName =
  "mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none";

const textareaClassName =
  "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none";

const labelClassName = "block text-sm font-medium text-zinc-700";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>
  );
}

export function EventForm({ initialEvent, onCancel, onSaved }: EventFormProps) {
  const isEditing = initialEvent !== null;

  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [category, setCategory] = useState<string>(
    initialEvent?.category ?? "",
  );
  const [city, setCity] = useState(initialEvent?.city ?? "");
  const [dateTime, setDateTime] = useState(
    initialEvent ? toDateTimeLocalValue(initialEvent.dateTime) : "",
  );
  const [price, setPrice] = useState(
    initialEvent ? String(initialEvent.price) : "0",
  );
  const [description, setDescription] = useState(
    initialEvent?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(initialEvent?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(initialEvent?.isActive ?? true);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setFieldErrors({});
    setFormError(null);

    const priceNumber = Number(price);
    const payload: Record<string, unknown> = {
      title: title.trim(),
      category,
      city: city.trim(),
      dateTime: dateTime.trim(),
      price: price === "" ? Number.NaN : priceNumber,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      isActive,
    };

    const parsed = isEditing
      ? eventUpdateSchema.safeParse(payload)
      : eventCreateSchema.safeParse(payload);

    if (!parsed.success) {
      setFieldErrors(issuesToFieldErrors(allIssues(parsed.error)));
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        isEditing
          ? `/api/admin/events/${initialEvent.id}`
          : "/api/admin/events",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(parsed.data),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | ApiErrorBody
        | null;

      if (!response.ok) {
        if (data?.issues && data.issues.length > 0) {
          setFieldErrors(issuesToFieldErrors(data.issues));
        }
        setFormError(
          data?.error ??
            (isEditing
              ? "Unable to update the event."
              : "Unable to create the event."),
        );
        return;
      }

      onSaved(
        isEditing ? "Event updated successfully." : "Event created successfully.",
      );
    } catch {
      setFormError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="event-title" className={labelClassName}>
            Title
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={fieldErrors.title ? true : undefined}
            className={inputClassName}
            placeholder="Weekend music festival"
            disabled={isSaving}
          />
          <FieldError message={fieldErrors.title} />
        </div>

        <div>
          <label htmlFor="event-category" className={labelClassName}>
            Category
          </label>
          <select
            id="event-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-invalid={fieldErrors.category ? true : undefined}
            className={inputClassName}
            disabled={isSaving}
          >
            <option value="">Select a category</option>
            {EVENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.category} />
        </div>

        <div>
          <label htmlFor="event-city" className={labelClassName}>
            City
          </label>
          <input
            id="event-city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-invalid={fieldErrors.city ? true : undefined}
            className={inputClassName}
            placeholder="Bengaluru"
            disabled={isSaving}
          />
          <FieldError message={fieldErrors.city} />
        </div>

        <div>
          <label htmlFor="event-date-time" className={labelClassName}>
            Date and time
          </label>
          <input
            id="event-date-time"
            type="datetime-local"
            value={dateTime}
            onChange={(event) => setDateTime(event.target.value)}
            aria-invalid={fieldErrors.dateTime ? true : undefined}
            className={inputClassName}
            disabled={isSaving}
          />
          <FieldError message={fieldErrors.dateTime} />
        </div>

        <div>
          <label htmlFor="event-price" className={labelClassName}>
            Price (INR)
          </label>
          <input
            id="event-price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            aria-invalid={fieldErrors.price ? true : undefined}
            className={inputClassName}
            placeholder="0"
            disabled={isSaving}
          />
          <FieldError message={fieldErrors.price} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="event-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="event-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={fieldErrors.description ? true : undefined}
            className={textareaClassName}
            placeholder="Tell people what to expect at this event..."
            disabled={isSaving}
          />
          <FieldError message={fieldErrors.description} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="event-image-url" className={labelClassName}>
            Image URL
          </label>
          <input
            id="event-image-url"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            aria-invalid={fieldErrors.imageUrl ? true : undefined}
            className={inputClassName}
            placeholder="https://images.example.com/event.jpg"
            disabled={isSaving}
          />
          <FieldError message={fieldErrors.imageUrl} />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
              disabled={isSaving}
            />
            <span className="text-sm font-medium text-zinc-700">
              Active (visible on the public events page)
            </span>
          </label>
          <FieldError message={fieldErrors.isActive} />
        </div>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="h-11 rounded-full border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="h-11 rounded-full bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create event"}
        </button>
      </div>
    </form>
  );
}
