const footerLinks = [
  { href: "/", label: "Home" },
  { href: "#upcoming", label: "Events" },
  { href: "#about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-900">
            Community<span className="text-violet-600">Events</span>
          </p>
          <p className="text-sm text-zinc-500">
            A friendly board for local events and gatherings.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-zinc-500 transition-colors hover:text-violet-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-sm text-zinc-400">
          &copy; 2026 Community Events Board
        </p>
      </div>
    </footer>
  );
}
