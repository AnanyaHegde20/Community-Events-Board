import type { EventCategory } from "@/lib/event-categories";
import type { AdminEventListItem } from "@/types/events";

type EventDocumentLike = {
  _id: unknown;
  title: string;
  category: string;
  city: string;
  dateTime: Date;
  price: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

export function toAdminEventListItem(
  doc: EventDocumentLike,
): AdminEventListItem {
  return {
    id: String(doc._id),
    title: doc.title,
    category: doc.category as EventCategory,
    city: doc.city,
    dateTime: doc.dateTime.toISOString(),
    price: doc.price,
    description: doc.description,
    imageUrl: doc.imageUrl,
    isActive: doc.isActive,
  };
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
