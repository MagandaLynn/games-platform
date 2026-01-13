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

            <div className="grid gap-3">
              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Easy
                </div>
                <p className="mt-1">
                  No repeated characters. (Each digit/letter can appear at most
                  once in the answer.)
                </p>
              </div>

              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Challenge
                </div>
                <p className="mt-1">
                  Repeats are allowed. The answer may contain the same
                  digit/letter more than once.
                </p>
              </div>

              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Coming soon: Medium
                </div>
                <p className="mt-1">
                  Easy rules, but repeats can appear sometimes. A bridge between
                  Easy and Challenge.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-bg-soft p-3">
              <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Ratings
              </div>
              <p className="mt-1 text-text-muted">
                Ratings are a fun summary of how your solve went — lower guesses
                and better accuracy earn stronger titles.
              </p>

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
        {Number.isFinite(r.max) && (
          <> — {r.max} guesses or fewer</>
        )}
      </li>
    ))}
  </ul>

  <p className="mt-2 text-xs text-text-muted">
    Ratings may evolve as the game grows.
  </p>
</div>


              <p className="mt-2 text-xs text-text-muted">
                (Exact thresholds may change as the game evolves.)
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
