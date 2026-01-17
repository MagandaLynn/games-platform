"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { CHALLENGE_RATINGS, challengeRatingLabel } from "../helpers/share-results";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function RulesModal({ open, onClose }: Props) {
  const titleId = useId();
  const [step, setStep] = useState(0);

  // 0: How to play, 1: Hex codes, 2: Modes, 3: Ratings
  const totalSteps = 4;

  useEffect(() => {
    if (!open) return;
    setStep(0);
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
    if (step === 2) return "Modes";
    return "Ratings";
  }, [step]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          relative w-full max-w-md rounded-2xl bg-bg-panel text-text shadow-xl ring-1 ring-black/10
          flex flex-col
          max-h-[calc(100dvh-2rem)]
        "
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-extrabold leading-6">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Guess the 6-digit hex color in as few tries as possible.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg bg-bg-soft px-3 py-2 text-sm font-semibold text-text hover:opacity-90 transition"
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>

        {/* Body (scrolls) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-sm leading-5">
          {step === 0 && (
            <div className="space-y-2">
              <div className="rounded-xl bg-bg-soft p-2">
                <p className="font-semibold">
                  Wurple rewards intuition <em>and</em> logic.
                </p>
                <p className="text-text-muted">
                  Some players chase colors. Others crack codes. Different paths. Same
                  solution.
                </p>
              </div>

              <p className="text-text-muted">
                Each guess is a hex code like{" "}
                <span className="font-mono font-semibold text-text">3FA6D0</span>. After
                you submit, tiles show feedback for each character:
              </p>

              <ul className="ml-4 list-disc space-y-1 text-text-muted">
                <li className="flex items-start gap-2">
                  <span
                    className="mt-[2px] inline-block h-4 w-4 rounded-sm bg-green-400"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-text">Green</span> = right
                    character, right spot
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="mt-[2px] inline-block h-4 w-4 rounded-sm bg-yellow-400"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-text">Yellow</span> = in the
                    code, wrong spot
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="mt-[2px] inline-block h-4 w-4 rounded-sm bg-gray-400"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-text">Gray</span> = not in the
                    code
                  </span>
                </li>
              </ul>

              <p className="text-xs text-text-muted">
                Same date = same puzzle for everyone (per mode). Come back tomorrow for a new puzzle.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <div className="rounded-xl bg-bg-soft p-2">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  What is a hex code?
                </div>

                <p className="text-text-muted">
                  A hex color is a 6 character code: {" "}
                  <span className="font-mono font-semibold text-text">RRGGBB</span><br />
                  <span className="font-semibold text-text">Red (RR)</span>,{" "}
                  <span className="font-semibold text-text">Green (GG)</span>,{" "}
                  <span className="font-semibold text-text">Blue (BB)</span>, 
                  each range from 00 to FF (decimal 0–255).
                
                  <br />
                </p>

                
                    <span className="font-mono font-semibold text-text">00</span> = none
                    <span className="font-mono font-semibold text-text pl-3">FF</span> = max
                    <span className="pl-3"> Higher = more intensity</span>
                
              </div>

              <div className="rounded-xl bg-bg-soft p-2">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Quick examples
                </div>

                <div className="mt-1 grid gap-1.5 text-text-muted">
                  {[
                    { hex: "000000", label: "black" },
                    { hex: "FFFFFF", label: "white" },
                    { hex: "FF0000", label: "red" },
                    { hex: "00FF00", label: "green" },
                    { hex: "0000FF", label: "blue" },
                  ].map((ex) => (
                    <div
                      key={ex.hex}
                      className="flex items-center gap-2 rounded-lg bg-bg-panel/40 px-2 py-1"
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-sm ring-1 ring-black/10 dark:ring-white/10"
                        style={{ backgroundColor: `#${ex.hex}` }}
                        aria-hidden
                      />
                      <span className="font-mono font-semibold text-text">{ex.hex}</span>
                      <span className="text-xs text-text-muted">— {ex.label}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-1 text-xs text-text-muted">
                    You don't need to be a color expert to play Wurple. Just use the feedback tiles to guide your guesses!
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="grid gap-2">
                <div className="rounded-xl bg-bg-soft p-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    Easy
                  </div>
                  <p className="text-text-muted">
                    No repeated characters.{" "}
                    <span className="font-semibold text-text">6 guesses</span> max.
                  </p>
                </div>

                <div className="rounded-xl bg-bg-soft p-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    Challenge
                  </div>
                  <p className="text-text-muted">
                    Repeats allowed. No guess limit. Includes{" "}
                    <span className="font-semibold text-text">Distance</span> feedback
                    to help you converge.
                  </p>
                </div>
              </div>

              <p className="text-xs text-text-muted">
                There are two modes to suit different play styles and skill levels. Each mode has its own daily puzzle.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <div className="rounded-xl bg-bg-soft p-2">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Ratings (Challenge)
                </div>

                <p className="text-text-muted">
                  Rating is based on guesses to solve:
                </p>

                <ul className="ml-4 list-disc space-y-1 text-text-muted">
                  {CHALLENGE_RATINGS.map((r: challengeRatingLabel, i) => (
                    <li key={i}>
                      {Number.isFinite(r.max) && <>{r.max} or fewer: </>}
                      {r.min != null && <>{r.min} or more: </>}
                      <span className="font-semibold text-text">{r.label}</span>
                    
                    </li>
                  ))}
                </ul>

                <p className="mt-1 text-xs text-text-muted">
                  Ratings may evolve as the game grows.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-black/10 px-4 py-3 dark:border-white/10">
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

          {/* Nav */}
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
