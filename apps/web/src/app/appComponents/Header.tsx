"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  // const onGamePage = pathname?.startsWith("/wurple");
  //  ${onGamePage ? "h-8" : "h-10"}
  return (
    <header
      className={`
        sticky top-0 z-40 w-full
        bbg-[#0B1020] border-b border-link dark:border-white/10
        bg-bg-panel/90 backdrop-blur
        
      `}
    >
      <div
        className={`
          mx-auto flex max-w-6xl items-center justify-between
          px-3 h-8
        `}
      >
        {/* Left: Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80"
        >
          <span className="select-none">◼︎</span>
          <span>Decide ~ Learn ~ Do</span>
        </Link>

        {/* Right: Global actions */}
        <nav className="flex items-center gap-2">
          {/* <Link
            href="/games"
            className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-bg-soft hover:text-text transition"
          >
            Games
          </Link> */}

          {/* Placeholder for future auth / theme */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
