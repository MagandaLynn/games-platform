"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { CHALLENGE_RATINGS } from "../helpers/share-results";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function RulesModal({ open, onClose }: Props) {
  const titleId = useId();
  const [step, setStep] = useState(0);

  const totalSteps = 3;

  useEffect(() => {
    if (!open) return;
    setStep(0); // reset when opened
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const canBack = step > 0;
  const canNext = step < totalSteps - 1;

  const title = useMemo(() => {
    if (step === 0) return "How to play Wurple";
    if (step === 1) return "Hex codes (RRGGBB)";
    return "Modes & ratings";
  }, [step]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop: click to close */}
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-bg-panel text-text shadow-xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <h2 id={titleId} className="text-lg font-extrabold">
              {title}
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

        {/* Body */}
        <div className="px-5 py-4 text-sm leading-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-bg-soft p-3">
                <p className="font-semibold">
                  Wurple rewards intuition <em>and</em> logic.
                </p>
                <p className="mt-1 text-text-muted">
                  Some players chase colors. Others crack codes. The puzzle doesn't care
                  how you think — only that you think.
                </p>
              </div>

              <p>
                Each guess is a hex code like <span className="font-mono">3FA6D0</span>.
                After you submit, tiles show feedback for each character.
              </p>

              <ul className="ml-4 list-disc space-y-1 text-text-muted">
                <li>
                  <span className="font-semibold text-text">Green</span>: correct
                  character in the correct spot
                </li>
                <li>
                  <span className="font-semibold text-text">Yellow</span>: character
                  appears in the code, but in a different spot
                </li>
                <li>
                  <span className="font-semibold text-text">Gray</span>: character not
                  in the code
                </li>
              </ul>

              <p className="text-text-muted">
                Same date = same puzzle for everyone (per mode). Come back tomorrow for
                a new one.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  What is a hex code?
                </div>
                <p className="mt-1 text-text-muted">
                  A hex color is written as <span className="font-mono">RRGGBB</span>.
                  Each pair controls how much Red, Green, and Blue the color has.
                </p>

                <ul className="mt-2 ml-4 list-disc space-y-1 text-text-muted">
                  <li>
                    <span className="font-mono">00</span> means none of that color
                  </li>
                  <li>
                    <span className="font-mono">FF</span> means the maximum amount
                  </li>
                  <li>Higher values = more intensity, lower values = less</li>
                </ul>

                <p className="mt-2 text-text-muted">
                  Examples: <span className="font-mono">000000</span> is black,{" "}
                  <span className="font-mono">FFFFFF</span> is white,{" "}
                  <span className="font-mono">FF0000</span> is pure red,{" "}
                  <span className="font-mono">00FF00</span> is pure green,{" "}
                  <span className="font-mono">0000FF</span> is pure blue.
                </p>

                <p className="mt-2 text-xs text-text-muted">
                  You don't need to be a color expert to play Wurple. Just use the
                  feedback tiles to guide your guesses!
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="rounded-xl bg-bg-soft p-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    Easy
                  </div>
                  <p className="mt-1">
                    No repeated characters. Maximum of 6 guesses to find the answer.
                  </p>
                </div>

                <div className="rounded-xl bg-bg-soft p-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    Challenge
                  </div>
                  <p className="mt-1">
                    Repeats characters are allowed. No maximum number of guesses. 
                  </p>
                </div>

              </div>

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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-black/10 px-5 py-4 dark:border-white/10">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === step ? "bg-link" : "bg-bg-soft"
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={!canBack}
              className="rounded-lg bg-bg-soft px-4 py-2 text-sm font-semibold text-text disabled:opacity-50 hover:opacity-90 transition"
            >
              Back
            </button>

            {canNext ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
                className="rounded-lg bg-link px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-link px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
