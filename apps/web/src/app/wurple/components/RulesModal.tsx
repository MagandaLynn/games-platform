"use client";

import { useEffect, useId } from "react";
import { CHALLENGE_RATINGS } from "../helpers/share-results";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function RulesModal({ open, onClose }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-md rounded-2xl bg-bg-panel text-text shadow-xl ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <h2 id={titleId} className="text-lg font-extrabold">
              How to play Wurple
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Guess the 6-digit hex color in as few tries as possible.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-bg-soft px-3 py-2 text-sm font-semibold text-text hover:opacity-90 transition"
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 text-sm leading-6">
          <div className="space-y-4">
            {/* Thematic intro */}
            <div className="rounded-xl bg-bg-soft p-3">
              <p className="font-semibold">Wurple rewards intuition <em>and</em> logic.</p>
              <p className="mt-1 text-text-muted">
                Some players chase colors. Others crack codes. The puzzle doesn't care how
                you think — only that you think.
              </p>
            </div>

            <p>
              Each guess is a hex code like{" "}
              <span className="font-mono">3FA6D0</span>. After you submit, tiles
              show feedback for each character.
            </p>

            <ul className="ml-4 list-disc space-y-1 text-text-muted">
              <li>
                <span className="font-semibold text-text">Green</span>: correct
                character in the correct spot
              </li>
              <li>
                <span className="font-semibold text-text">Yellow</span>:
                character appears in the code, but in a different spot
              </li>
              <li>
                <span className="font-semibold text-text">Gray</span>: character
                not in the code
              </li>
            </ul>

            {/* Hex explanation (longer version you liked) */}
            <div className="rounded-xl bg-bg-soft p-3">
              <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                What is a hex code?
              </div>
              <p className="mt-1 text-text-muted">
                A hex code is a six-character way of describing color, written as{" "}
                <span className="font-mono">RRGGBB</span>.
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-text-muted">
                <li>
                  <span className="font-mono">RR</span> = red,{" "}
                  <span className="font-mono">GG</span> = green,{" "}
                  <span className="font-mono">BB</span> = blue
                </li>
                <li>
                  Each pair ranges from <span className="font-mono">00</span> to{" "}
                  <span className="font-mono">FF</span>
                </li>
                <li>
                  <span className="font-mono">00</span> means none of that color,{" "}
                  <span className="font-mono">FF</span> means the maximum
                </li>
              </ul>

              <p className="mt-2 text-text-muted">
                Examples: <span className="font-mono">000000</span> is black,{" "}
                <span className="font-mono">FFFFFF</span> is white,{" "}
                <span className="font-mono">FF0000</span> is pure red,{" "}
                <span className="font-mono">00FF00</span> is pure green, and{" "}
                <span className="font-mono">0000FF</span> is pure blue.
              </p>
            </div>

            {/* Modes */}
            <div className="grid gap-3">
              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Easy
                </div>
                <p className="mt-1">
                  No repeated characters and a maximum of 6 guesses.
                </p>
              </div>

              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Challenge
                </div>
                <p className="mt-1">
                  Repeat characters are allowed. No max guesses — play until you solve
                  it!
                </p>
              </div>

            </div>

            {/* Ratings (Challenge Mode) */}
            <div className="rounded-xl bg-bg-soft p-3">
              <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Ratings (Challenge Mode)
              </div>

              <p className="mt-1 text-text-muted">
                Your rating is based on how many guesses it took to solve the puzzle.
              </p>

              <ul className="mt-2 ml-4 list-disc space-y-1 text-text-muted">
                {CHALLENGE_RATINGS.map((r, i) => (
                  <li key={i}>
                    <span className="font-semibold text-text">{r.label}</span>
                    {Number.isFinite(r.max) && <> — {r.max} guesses or fewer</>}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-xs text-text-muted">
                Ratings may evolve as the game grows.
              </p>
            </div>

            <p className="text-text-muted">
              Same date = same color for everyone (per mode). Come back tomorrow
              for a new one.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/10 px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-link px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

