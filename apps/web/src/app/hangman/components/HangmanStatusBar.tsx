"use client";

import * as React from "react";

type HangmanStatus = "playing" | "won" | "lost";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function HangmanStatusBar({
  status,
  wrongGuesses,
  maxWrong,
  wrongLetters,
  className,
}: {
  status: HangmanStatus;
  wrongGuesses: number;
  maxWrong: number;
  wrongLetters?: string[];
  className?: string;
}) {
  console.log(maxWrong)
  const pct =
    maxWrong > 0 ? Math.min(100, Math.round((wrongGuesses / maxWrong) * 100)) : 0;
  console.log('pct:', pct);
  const hasWrongLetters = (wrongLetters?.length ?? 0) > 0;
  const [open, setOpen] = React.useState(false);

  const pillClass = cx(
    "rounded-full px-2.5 py-1 text-xs font-semibold border",
    // Neutral base uses your theme tokens (works in light/dark)
    status === "playing" && "border-link/30 bg-link/15 text-text",
    status === "won" && "border-green-700 bg-green-400 text-white",
    status === "lost" && "border-red-700 bg-red-600 text-white"
  );
console.log('pillClass:', pillClass);
  const barFillClass = cx(
    "h-full transition-all duration-300",
    status === "won"
      ? "bg-green-500/70"
      : status === "lost"
      ? "bg-red-500/70"
      : "bg-link/70"
  );

  return (
    <div className={cx("w-full", className)}>
      {/* Row 1: status + mistakes */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={pillClass}>
          {status === "playing" ? "Playing" : status === "won" ? "Won" : "Lost"}
        </span>

        <div className="text-sm text-text">
          <span className="mr-2 text-text-muted">Mistakes</span>
          <span className="font-semibold">
            {wrongGuesses}/{maxWrong}
          </span>
        </div>

        {hasWrongLetters && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 text-xs text-text-muted hover:opacity-90 transition"
            aria-expanded={open}
          >
            {open ? "Hide details" : "Details"}
          </button>
        )}
      </div>

      {/* Row 2: progress bar */}
      <div className="w-1/2  mt-2">
        <div className="mt-2 h-2 max-w-[340px] overflow-hidden rounded-full bg-bg-soft border border-black dark:border-white">

            <div className={barFillClass} style={{ width: `${pct}%` }} />
        </div>
      </div>
      
      {/* Optional details */}
      {open && hasWrongLetters && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {wrongLetters!.map((ch) => (
            <span
              key={ch}
              className="rounded-md border border-white/10 bg-bg-soft px-2 py-1 text-xs font-semibold text-text"
            >
              {ch}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
