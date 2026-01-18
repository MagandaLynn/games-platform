"use client";

import Link from "next/link";

type GameMode = "easy" | "challenge";
type GameStatus = "playing" | "won" | "lost";

export type GameBarContext = {
  title?: string; // e.g. "Wurple"
  subtitle?: string; // e.g. "Today's Puzzle" | "Archive" | "Jan 6, 2026"
  mode?: string; // e.g. "easy" | "challenge"
  status?: GameStatus;
  guesses?: { used: number; max: number | null };
};

type Props = {
  backHref?: string; // e.g. "/games" or "/"
  context?: GameBarContext;

  // Actions (wire these to your modals)
  onOpenRules?: () => void;
  onOpenStats?: () => void;
  onShare?: () => void;
  onOpenSettings?: () => void;

  // Optional: mode picker in header
  onSetMode?: (mode: string) => void;
};

function ModeChip({
  mode,
  onSetMode,
}: {
  mode: string;
  onSetMode?: (mode: string) => void;
}) {
  if (!onSetMode) {
    return (
      <span className="rounded-full bg-bg-soft px-2 py-1 text-xs font-semibold text-text">
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </span>
    );
  }

  return (
    <div className="flex overflow-hidden rounded-full bg-bg-soft">
      <button
        type="button"
        onClick={() => onSetMode("easy")}
        className={`px-2 py-1 text-xs font-semibold transition ${
          mode === "easy" ? "bg-link text-white" : "text-text hover:opacity-90"
        }`}
      >
        Easy
      </button>
      <button
        type="button"
        onClick={() => onSetMode("challenge")}
        className={`px-2 py-1 text-xs font-semibold transition ${
          mode === "challenge" ? "bg-link text-white" : "text-text hover:opacity-90"
        }`}
      >
        Challenge
      </button>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg bg-bg-soft text-text hover:opacity-90 transition"
    >
      <span className="text-base leading-none">{children}</span>
    </button>
  );
}

export default function GameBar({
  backHref = "/",
  context,
  onOpenRules,
  onOpenStats,
  onShare,
  onOpenSettings,
  onSetMode,
}: Props) {
  const title = context?.title ?? "Game";
  const subtitle = context?.subtitle;
  const mode = context?.mode;

  const guesses = context?.guesses;
  const status = context?.status;

  return (
    <header className="sticky top-8 z-30 w-full bg-[#121A2A] border-b border-link mb-2 dark:border-white/10 bg-bg-panel">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-3">
        {/* Left cluster */}
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={backHref}
            className="grid h-9 w-9 place-items-center rounded-lg bg-bg-soft hover:opacity-90 transition"
            aria-label="Back"
          >
            ←
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-extrabold">{title}</span>

              {mode && <ModeChip mode={mode} onSetMode={onSetMode} />}

              {guesses && (
                <span className="rounded-full bg-bg-soft px-2 py-1 text-xs font-semibold text-text-muted">
                  {guesses.used}
                  {typeof guesses.max === "number" ? `/${guesses.max}` : ""}
                </span>
              )}

              {status && status !== "playing" && (
                <span className="rounded-full bg-bg-soft px-2 py-1 text-xs font-semibold">
                  {status === "won" ? "Won" : "Lost"}
                </span>
              )}
            </div>

            {subtitle && (
              <div className="truncate text-xs text-text-muted">{subtitle}</div>
            )}
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {onOpenRules && <IconButton label="Rules" onClick={onOpenRules}>?</IconButton>}
          {onOpenStats && <IconButton label="Stats" onClick={onOpenStats}>📊</IconButton>}
          {onShare && <IconButton label="Share" onClick={onShare}>↗</IconButton>}
          {onOpenSettings && (
            <IconButton label="Settings" onClick={onOpenSettings}>⚙</IconButton>
          )}
        </div>
      </div>
    </header>
  );
}
