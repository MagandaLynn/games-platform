"use client";

import * as React from "react";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWrong?: number; // default 6
  className?: string;
};

export function HangmanRulesModal({
  open,
  onClose,
  title = "How to Play",
  maxWrong = 6,
  className,
}: Props) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // Close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock scroll when open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus panel when opened
  React.useEffect(() => {
    if (open) {
      window.setTimeout(() => panelRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"

      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close rules"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "relative w-full sm:max-w-lg",
          "rounded-2xl ",
          "bg-bg-panel border border-white/10",
          "shadow-2xl",
          "p-5 sm:p-6",
          "mb-0 sm:mb-0"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white/90">{title}</h2>
            <p className="mt-1 text-sm text-white/60">
              Guess the phrase one letter at a time.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-white/80 hover:bg-white/10 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-sm text-white/75">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/85">Goal</h3>
            <p>
              Reveal the full phrase before you run out of mistakes. Letters you
              guess correctly appear in the phrase. Incorrect guesses build the hangman.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/85">How guessing works</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tap a letter on the on-screen keyboard (or use your physical keyboard).</li>
              <li>Correct letters are revealed everywhere they appear.</li>
              <li>Wrong letters count as mistakes and add a new body part.</li>
              <li>Repeated guesses don’t cost you anything (they’re ignored).</li>
            </ul>
          </section>
{/* 
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/85">Mistakes</h3>
            <p>
              You can make up to{" "}
              <span className="font-semibold text-white/90">{maxWrong}</span>{" "}
              mistakes. At {maxWrong}/{maxWrong}, the game ends.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/70">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                1: Head
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                2: Body
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                3–4: Arms
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                5–6: Legs
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 col-span-2">
                {maxWrong}: Game over 💀
              </div>
            </div>
          </section> */}

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-white/85">Hint</h3>
            <p>
              The hint is optional. You can reveal it if you get stuck. (Your share
              result may indicate that a hint was used.)
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
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
