"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="mb-6 flex items-center justify-between">
      {/* Left: app identity */}
      <Link
        href="/wurple"
        className="text-lg font-bold tracking-tight text-text hover:opacity-90 transition"
      >
        Wurple
      </Link>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Future-friendly: add buttons here later */}
        {/* <Link href="/wurple/archive" className="text-sm text-link hover:underline">Archive</Link> */}
        <ThemeToggle />
      </div>
    </header>
  );
}
