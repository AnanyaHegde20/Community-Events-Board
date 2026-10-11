import { EventsBrowser } from "@/components/events-browser";

const features = [
  {
    title: "Discover what's nearby",
    description:
      "Browse meetups, workshops, volunteer days, and neighborhood gatherings in one simple feed.",
  },
  {
    title: "Host your own",
    description:
      "Organizers can post community events so neighbors can find them and join in.",
  },
  {
    title: "Free for everyone",
    description:
      "No account needed to browse. The board is built for open, welcoming communities.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-violet-100 via-violet-50 to-transparent"
        />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-sm font-medium text-violet-700 shadow-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              Community-powered events, all in one place
            </p>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl sm:leading-tight">
              Discover events happening{" "}
              <span className="text-violet-600">around you</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              The Community Events Board helps neighbors find local happenings —
              from casual meetups to workshops and volunteer days — and gives
              organizers a simple place to share them.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#upcoming"
                className="w-full rounded-full bg-violet-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 sm:w-auto"
              >
                Browse upcoming events
              </a>
              <a
                href="#about"
                className="w-full rounded-full border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-violet-300 hover:text-violet-700 sm:w-auto"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <EventsBrowser />

      <section
        id="about"
        aria-labelledby="about-heading"
        className="border-t border-zinc-200 bg-white"
      >
        <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="about-heading"
              className="text-3xl font-semibold tracking-tight text-zinc-900"
            >
              Built for local communities
            </h2>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              A simple, friendly place to share what is happening in the
              neighborhood.
            </p>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-sm font-semibold text-white">
                  {feature.title.charAt(0)}
                </span>
                <h3 className="mt-4 text-base font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
