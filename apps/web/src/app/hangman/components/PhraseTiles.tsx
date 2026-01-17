import * as React from "react";

type Slot =
  | { kind: "letter"; value: string | null } // null = hidden
  | { kind: "punct"; value: string }
  | { kind: "space" };

function isAZ(ch: string) {
  return ch >= "A" && ch <= "Z";
}

function buildSlotsFromMasked(masked: string): Slot[] {
  return masked.split("").map((ch) => {
    if (ch === " ") return { kind: "space" };
    if (ch === "_") return { kind: "letter", value: null };
    if (isAZ(ch)) return { kind: "letter", value: ch };
    return { kind: "punct", value: ch };
  });
}

function splitIntoWords(masked: string) {
  // preserves spaces by splitting into words; we rebuild spacing via layout gaps
  return masked.split(" ").filter(Boolean);
}

export function PhraseTiles({
  masked,
  revealDelayMs = 70, // tweak: 40–90 feels good
}: {
  masked: string;
  revealDelayMs?: number;
}) {
  // What we actually render (animates toward `masked`)
  const [displayedMasked, setDisplayedMasked] = React.useState(masked);

  // Indices that should animate (the one currently being revealed)
  const [animatingIdx, setAnimatingIdx] = React.useState<number | null>(null);

  // Keep a ref to cancel/sequence reveals safely
  const timerRef = React.useRef<number | null>(null);

  // Reset immediately if phrase length changed (new puzzle)
  React.useEffect(() => {
    if (masked.length !== displayedMasked.length) {
      setDisplayedMasked(masked);
      setAnimatingIdx(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masked.length]);

  React.useEffect(() => {
    // Clear any pending timer when masked changes
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If already in sync, nothing to do
    if (masked === displayedMasked) return;

    // Find newly revealed positions: "_" -> "A"–"Z"
    const revealQueue: number[] = [];
    for (let i = 0; i < masked.length; i++) {
      const prev = displayedMasked[i];
      const next = masked[i];
      if (prev === "_" && isAZ(next)) revealQueue.push(i);
    }

    // If there are no letter reveals (e.g., wrong guess), sync immediately
    if (revealQueue.length === 0) {
      setDisplayedMasked(masked);
      setAnimatingIdx(null);
      return;
    }

    // Reveal one index at a time
    const step = () => {
      const idx = revealQueue.shift();
      if (idx === undefined) {
        // done: sync fully (covers punctuation/other non-letter changes)
        setDisplayedMasked(masked);
        setAnimatingIdx(null);
        return;
      }

      setDisplayedMasked((cur) => {
        // Replace character at idx with the new one from `masked`
        const chars = cur.split("");
        chars[idx] = masked[idx];
        return chars.join("");
      });

      setAnimatingIdx(idx);

      timerRef.current = window.setTimeout(step, revealDelayMs);
    };

    step();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [masked, displayedMasked, revealDelayMs]);

  // Build slots from displayedMasked (the animated version)
  const slots = buildSlotsFromMasked(displayedMasked);

  // Render word-aware wrapping: we render groups separated by spaces.
  // We'll map indices so we can know which slot is animating.
  const words = splitIntoWords(displayedMasked);

  // Build a mapping from (wordIdx, charIdxInWord) -> global index in displayedMasked
  // so we can compare to animatingIdx.
  let globalIndex = 0;

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
      {words.map((word, wordIdx) => {
        // Find this word’s starting global index by skipping spaces in the original string.
        // We can compute by walking displayedMasked until we reach the next non-space chunk.
        // Simpler: rebuild from the full slots list with a pointer.
        // We’ll compute the start index for this word by scanning forward from current globalIndex until non-space.
        while (displayedMasked[globalIndex] === " ") globalIndex++;

        const wordStart = globalIndex;
        const wordSlots = buildSlotsFromMasked(word).filter((s) => s.kind !== "space");

        // Advance globalIndex by word length (then a space)
        globalIndex = wordStart + word.length + 1;

        return (
          <div key={wordIdx} className="inline-flex items-end gap-2 mr-6 whitespace-nowrap">
            {wordSlots.map((slot, i) => {
              const absoluteIdx = wordStart + i;
              const isAnimating = animatingIdx === absoluteIdx;

              if (slot.kind === "punct") {
                return (
                  <span
                    key={i}
                    className="text-xl sm:text-2xl font-mono text-zinc-800 dark:text-zinc-200"
                    aria-label={`Punctuation ${slot.value}`}
                  >
                    {slot.value}
                  </span>
                );
              }

              // Letter slot (underline look, constant width)
              const value = slot.value;

              return (
                <span key={i} className="flex flex-col items-center w-8 sm:w-10">
                  {/* letter area (reserved height) */}
                  <span className="h-7 sm:h-8 flex items-center justify-center overflow-visible">
                    <span
                      className={[
                        "text-xl sm:text-2xl font-mono font-semibold text-zinc-900 dark:text-zinc-100",
                        "transition-all duration-2000 ease-out",
                        // When hidden, keep a placeholder but invisible (prevents layout shift)
                        value ? "opacity-100" : "opacity-0",
                        // Slide-up only for the newly revealed tile
                        isAnimating ? "translate-y-0" : value ? "translate-y-0" : "translate-y-1",
                        isAnimating ? "animate-none" : "",
                      ].join(" ")}
                    >
                      {value ?? "A"}
                    </span>
                  </span>

                  {/* underline */}
                  <span
                    className={[
                      "w-full border-b-2",
                      isAnimating
                        ? "border-zinc-900 dark:border-zinc-100"
                        : "border-zinc-600 dark:border-zinc-400",
                      "transition-colors duration-200 ease-out",
                    ].join(" ")}
                  />
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

