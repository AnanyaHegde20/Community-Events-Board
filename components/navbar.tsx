"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthMenu } from "@/components/auth-menu";

const navLinks = [
  { href: "#upcoming", label: "Events" },
  { href: "#about", label: "About" },
];

function MarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M4 20c2.5-6 5-9 8-9s5.5 3 8 9" />
      <path d="M9 8.5c.7-1.8 1.8-3 3-3s2.3 1.2 3 3" />
      <circle cx="12" cy="4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 text-paper backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-clay transition-colors group-hover:border-clay/60">
            <MarkIcon />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-paper">
            Community
            <span className="text-clay">Events</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="eyebrow text-paper/70 transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
          <a href="#upcoming" className="btn btn-primary !px-5 !py-2.5 !text-xs">
            Browse events
          </a>
          <AuthMenu />
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-paper transition-colors hover:border-white/40 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
          >
            {isMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-white/10 bg-ink px-4 pb-5 pt-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-paper/80 transition-colors hover:bg-white/5 hover:text-paper"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="#upcoming"
                className="btn btn-primary mt-2 w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse events
              </a>
            </li>
            <li className="mt-3 border-t border-white/10 pt-4">
              <AuthMenu />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
