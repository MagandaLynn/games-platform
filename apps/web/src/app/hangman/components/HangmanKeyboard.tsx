"use client";

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type KeyState = "idle" | "correct" | "wrong" | "guessed";

export function HangmanKeyboard({
  disabled,
  guessed,
  correctLetters,
  wrongLetters,
  onGuess,
}: {
  disabled?: boolean;
  guessed: string[];
  correctLetters: string[];
  wrongLetters: string[];
  onGuess: (letter: string) => void;
}) {
  const guessedSet = new Set((guessed ?? []).map((c) => c.toUpperCase()));
  const correctSet = new Set((correctLetters ?? []).map((c) => c.toUpperCase()));
  const wrongSet = new Set((wrongLetters ?? []).map((c) => c.toUpperCase()));

  function getKeyState(letter: string): KeyState {
    if (correctSet.has(letter)) return "correct";
    if (wrongSet.has(letter)) return "wrong";
    if (guessedSet.has(letter)) return "guessed";
    return "idle";
  }

  function keyClass(state: KeyState, isDisabled: boolean) {
    return cx(
      // Base (mobile-first) — flex-1 + min-w-0 so keys shrink to fit any screen
      "rounded-md border transition select-none flex items-center justify-center",
      "text-xs font-semibold",
      "flex-1 min-w-0 max-w-[42px] px-0.5 py-2 h-9",

      // Larger screens
      "sm:text-sm sm:px-2 sm:py-3 sm:h-11",

      state === "idle" && "border-white/10 bg-white/5 hover:bg-white/10",
      state === "guessed" && "border-white/10 bg-white/5 opacity-60",
      state === "correct" && "border-green-500/40 bg-green-500/25 text-white",
      state === "wrong" && "border-red-500/40 bg-red-500/25 text-white",

      isDisabled && "cursor-not-allowed"
    );
  }

  return (
    <div className="flex flex-col gap-1 sm:gap-2 w-full">
      {ROWS.map((row) => (
        <div
          key={row}
          className="flex justify-center gap-[3px] sm:gap-2"
        >
          {row.split("").map((ch) => {
            const state = getKeyState(ch);
            const isDisabled = !!disabled || guessedSet.has(ch);

            return (
              <button
                key={ch}
                type="button"
                disabled={isDisabled}
                className={keyClass(state, isDisabled)}
                onClick={() => onGuess(ch)}
              >
                {ch}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
