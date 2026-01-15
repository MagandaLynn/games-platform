import React from "react";
import { HEX_GRID } from "../helpers/constants";
import { keyStyle, popStyle } from "../helpers/helpers";

type KeyboardOptions = {
  status: "playing" | "won" | "lost";
  input: string;
  isSubmitting: boolean;
  heatmap: Record<string, "unknown" | "absent" | "present" | "correct">;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  submitGuess: () => void;
  setError: (error: string | null) => void;
  lastKey: string | null;
  setLastKey: (key: string | null) => void;
  usedInCurrent: Set<string>;
  rules: {
    allowDuplicates: boolean;
  };
};

export default function Keyboard({
  status,
  input,
  isSubmitting,
  heatmap,
  setInput,
  submitGuess,
  setError,
  lastKey,
  setLastKey,
  usedInCurrent,
  rules,
}: KeyboardOptions) {
  const disabledAll = status !== "playing";

  return (
    <div className="mt-4">
      {/* 4x4 hex grid */}
      <div className="grid grid-cols-4 gap-2 justify-center">
        {HEX_GRID.flat().map((k) => {
          const isUsed = !rules.allowDuplicates && usedInCurrent.has(k);
          const isDisabled = disabledAll || isUsed || input.length >= 6;

          return (
            <button
              key={k}
              type="button"
              disabled={isDisabled}
              className={[
                "h-11 w-11 rounded-[10px] font-mono font-extrabold tracking-widest select-none",
                "transition active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:opacity-60",
                // extra visual for duplicates-disallowed
                isUsed ? "opacity-35 grayscale-[0.4]" : "",
              ].join(" ")}
              style={{
                // keep your existing color logic + pop animation
                ...keyStyle(heatmap[k] ?? "unknown"),
                ...popStyle(lastKey === k),
              }}
              onClick={() => {
                if (disabledAll) return;

                setError(null);

                setInput((prev) => {
                  const next = k.toUpperCase();
                  if (prev.length >= 6) return prev;
                  if (!rules.allowDuplicates && prev.toUpperCase().includes(next)) return prev;
                  return (prev + next).toUpperCase();
                });

                setLastKey(k);
                setTimeout(() => setLastKey(null), 160);
              }}
              aria-label={`Key ${k}`}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="mt-3 flex gap-3 justify-center">
        <button
          type="button"
          onClick={() => setInput((prev) => prev.slice(0, -1))}
          disabled={disabledAll || input.length === 0}
          className={[
            "h-11 rounded-[10px] px-4",
            "bg-slate-800 text-slate-100",
            "font-semibold",
            "transition active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          ⌫ Backspace
        </button>

        <button
          type="button"
          onClick={submitGuess}
          disabled={disabledAll || input.length !== 6 || isSubmitting}
          className={[
            "h-11 rounded-[10px] px-5",
            "text-white font-extrabold tracking-wide",
            "transition active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            input.length === 6 && status === "playing" ? "bg-link" : "bg-slate-600",
          ].join(" ")}
          style={{
            animation:
              input.length === 6 && status === "playing"
                ? "readyPulse 600ms ease-in-out infinite"
                : undefined,
          }}
        >
          Guess
        </button>
      </div>
    </div>
  );
}

