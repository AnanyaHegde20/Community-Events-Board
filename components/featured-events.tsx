"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatEventDateTime,
  formatPrice,
} from "@/components/card-design-visuals";
import type { EventsApiResponse } from "@/types/events";

type FeaturedResult =
  | { status: "success"; events: EventsApiResponse["events"] }
  | { status: "empty" }
  | { status: "hidden" };

/**
 * Editorial strip of the nearest upcoming events, pulled from the public
 * events API. Hidden entirely on error or empty so the homepage never shows
 * broken chrome — the full discovery section below still works.
 */
export function FeaturedEvents() {
  const [result, setResult] = useState<FeaturedResult | null>(null);
  const requestIdRef = useRef(0);

  const queryKey = useMemo(() => "featured", []);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    fetch(`/api/events?limit=4`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as Partial<
          EventsApiResponse
        > & { error?: string };

        if (!response.ok || !Array.isArray(payload.events)) {
          throw new Error(payload.error ?? "Could not load events.");
        }

        return payload as EventsApiResponse;
      })
      .then((payload) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setResult(
          payload.events.length > 0
            ? { status: "success", events: payload.events }
            : { status: "empty" },
        );
      })
      .catch(() => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setResult({ status: "hidden" });
      });

    return () => controller.abort();
  }, [queryKey]);

  if (!result || result.status !== "success") return null;

  const [lead, ...rest] = result.events;

  return (
    <section
      aria-labelledby="featured-heading"
      className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-6">
        <div>
          <p className="eyebrow text-clay">Happening soon</p>
          <h2
            id="featured-heading"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            Featured this week
          </h2>
        </div>
        <a
          href="#upcoming"
          className="eyebrow text-slate-deep transition-colors hover:text-clay"
        >
          View all events &rarr;
        </a>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="group lg:col-span-7">
          <div className="photo-frame relative aspect-[16/10] overflow-hidden rounded-3xl border border-ink/10 bg-mist">
            <Image
              src={lead.imageUrl}
              alt={lead.title}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
            <span className="absolute top-4 left-4 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold tracking-widest text-paper uppercase backdrop-blur">
              {lead.category}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium tracking-wide text-slate-soft uppercase">
            <span>{formatEventDateTime(lead.dateTime)}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-clay" />
            <span>{lead.city}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-clay" />
            <span className="text-clay">{formatPrice(lead.price)}</span>
          </div>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {lead.title}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-deep/80">
            {lead.description}
          </p>
        </article>

        <div className="flex flex-col gap-6 lg:col-span-5">
          {rest.map((event) => (
            <article
              key={event.id}
              className="group flex flex-1 gap-4 rounded-2xl border border-ink/10 bg-white p-3 transition-colors hover:border-clay/40"
            >
              <div className="photo-frame relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-mist sm:w-28">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  sizes="7rem"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center py-1 pr-2">
                <p className="eyebrow !tracking-[0.16em] text-clay">
                  {event.category}
                </p>
                <h3 className="mt-1.5 truncate font-display text-base font-semibold tracking-tight text-ink">
                  {event.title}
                </h3>
                <p className="mt-1 text-xs font-medium tracking-wide text-slate-soft uppercase">
                  {event.city} · {formatEventDateTime(event.dateTime)}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {formatPrice(event.price)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
