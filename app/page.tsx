import Image from "next/image";
import { EventsBrowser } from "@/components/events-browser";
import { FeaturedEvents } from "@/components/featured-events";

const heroImages = {
  main: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1100&q=75",
  side: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=75",
  small: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=75",
};

const principles = [
  {
    number: "01",
    title: "Discover what's nearby",
    description:
      "Browse festivals, workshops, food walks, and neighborhood gatherings in one curated, nearest-first feed.",
  },
  {
    number: "02",
    title: "Make it yours",
    description:
      "Follow the categories you love, save reminders, and restyle every event card with your own themes and stickers.",
  },
  {
    number: "03",
    title: "Open to everyone",
    description:
      "No account needed to browse. The board is built for open, welcoming communities across India.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-clay/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-sage/15 blur-3xl"
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pt-24 lg:pb-28">
          <div className="lg:col-span-7">
            <p className="eyebrow text-clay">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-clay"
              />
              Community-powered events · All across India
            </p>

            <h1 className="mt-6 font-display text-4xl leading-[1.05] font-semibold tracking-tight text-paper sm:text-6xl lg:text-7xl">
              Find Your Next{" "}
              <span className="text-clay italic">Unforgettable</span>{" "}
              Experience
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-paper/70">
              From sundowner concerts to hands-on workshops and street food
              walks — discover the gatherings your city is talking about, and
              save the ones you cannot miss.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#upcoming"
                className="btn btn-primary !px-7 !py-3.5"
              >
                Explore events
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a
                href="#about"
                className="btn btn-ghost-paper !px-7 !py-3.5"
              >
                How it works
              </a>
            </div>

            <p className="mt-10 text-xs tracking-[0.2em] text-paper/40 uppercase">
              Music · Food · Workshops · Sports · Family
            </p>
          </div>

          <div className="relative lg:col-span-5">
            <div className="photo-frame relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10">
              <Image
                src={heroImages.main}
                alt="A crowd enjoying a live music festival at night"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-6 -left-4 w-40 sm:-left-8 sm:w-48 lg:-left-16">
              <div className="photo-frame relative aspect-square overflow-hidden rounded-2xl border-4 border-ink shadow-2xl">
                <Image
                  src={heroImages.side}
                  alt="A shared table of freshly prepared food"
                  fill
                  sizes="12rem"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="absolute -top-5 -right-3 w-32 sm:-right-6 sm:w-40 lg:-right-8">
              <div className="photo-frame relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-ink shadow-2xl">
                <Image
                  src={heroImages.small}
                  alt="Runners at a community sports event"
                  fill
                  sizes="10rem"
                  className="object-cover"
                />
              </div>
            </div>

            <span
              aria-hidden="true"
              className="absolute -right-2 bottom-16 hidden h-16 w-16 rounded-full border border-clay/50 lg:block"
            />
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <p className="eyebrow text-paper/50">
              Curated · Verified · Neighborhood-first
            </p>
            <p className="eyebrow text-paper/50">
              Live listings updated daily
            </p>
          </div>
        </div>
      </section>

      <FeaturedEvents />

      <EventsBrowser />

      <section
        id="about"
        aria-labelledby="about-heading"
        className="mt-20 bg-slate-deep text-paper"
      >
        <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="eyebrow text-clay-soft">About the board</p>
              <h2
                id="about-heading"
                className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper sm:text-4xl"
              >
                Built for local communities
              </h2>
              <p className="mt-5 text-base leading-7 text-paper/70">
                A simple, editorial place to share what is happening in the
                neighborhood — designed to feel like your city&apos;s culture
                section, not a spreadsheet.
              </p>
              <a
                href="#upcoming"
                className="btn btn-paper mt-8 !px-6"
              >
                Browse the board
              </a>
            </div>

            <ul className="lg:col-span-7">
              {principles.map((principle) => (
                <li
                  key={principle.number}
                  className="flex gap-6 border-t border-white/15 py-7 first:border-t-0 first:pt-0"
                >
                  <span className="font-display text-lg font-semibold text-clay-soft">
                    {principle.number}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-tight text-paper">
                      {principle.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-paper/70">
                      {principle.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
