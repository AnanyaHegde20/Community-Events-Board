import Link from "next/link";

const footerLinks = [
  { href: "#upcoming", label: "Events" },
  { href: "#about", label: "About" },
  { href: "/admin", label: "Admin" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-sm space-y-3">
            <p className="font-display text-2xl font-semibold tracking-tight">
              Community<span className="text-clay">Events</span>
            </p>
            <p className="text-sm leading-6 text-paper/60">
              A curated board for local festivals, workshops, food walks and
              neighborhood gatherings across India.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("#") ? (
                    <a
                      href={link.href}
                      className="eyebrow text-paper/60 transition-colors hover:text-clay"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="eyebrow text-paper/60 transition-colors hover:text-clay"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-wide text-paper/40">
            &copy; 2026 Community Events Board
          </p>
          <p className="eyebrow text-paper/40">Made for local communities</p>
        </div>
      </div>
    </footer>
  );
}
