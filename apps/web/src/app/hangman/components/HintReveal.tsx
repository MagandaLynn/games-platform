"use client"
import * as React from "react";

type HintRevealProps = {
  hint: string | null | undefined;
  revealLabel?: string;
  defaultOpen?: boolean;
  className?: string;
  showHint: boolean;
  onRevealHint: any;
};

export function HintReveal({
  hint,
  revealLabel = "Reveal hint",
  defaultOpen = false,
  className,
  showHint,
  onRevealHint,
}: HintRevealProps) {

  if (!hint || hint.trim().length === 0) return null;

  return (
    <div className={["flex flex-col my-4", className].filter(Boolean).join(" ")}>
      {!showHint ? (
        <button
          type="button"
          onClick={() => onRevealHint()}
          className="self-start text-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition "
        >
          {revealLabel}
        </button>
      ) : (
        <div className="self-start text-lg text-zinc-600 dark:text-zinc-300 transition-opacity duration-200 ease-out opacity-100">
          Hint: {hint}
        </div>
      )}
    </div>
  );
}
