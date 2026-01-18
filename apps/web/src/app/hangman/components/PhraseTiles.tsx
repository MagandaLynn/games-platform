import * as React from "react";

function isAZ(ch: string) {
  return ch >= "A" && ch <= "Z";
}

function revealIndices(prev: string, next: string): number[] {
  const out: number[] = [];
  const n = Math.min(prev.length, next.length);
  for (let i = 0; i < n; i++) {
    if (prev[i] === "_" && isAZ(next[i])) out.push(i);
  }
  return out;
}

export function PhraseTiles({
  masked,
  revealDelayMs = 120, 
}: {
  masked: string;
  revealDelayMs?: number;
}) {
  const [displayed, setDisplayed] = React.useState(masked);
  const [animIdx, setAnimIdx] = React.useState<number | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const prevMaskedRef = React.useRef(masked);

  // New puzzle / length change: sync immediately
  React.useEffect(() => {
    if (masked.length !== displayed.length) {
      setDisplayed(masked);
      setAnimIdx(null);
      prevMaskedRef.current = masked;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masked.length]);

  React.useEffect(() => {
    // Only run if masked actually changed
    if (prevMaskedRef.current === masked) return;
    prevMaskedRef.current = masked;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const queue = revealIndices(displayed, masked);

    // Wrong guess (no reveals): sync immediately
    if (queue.length === 0) {
      setDisplayed(masked);
      setAnimIdx(null);
      return;
    }

    let index = 0;
    const step = () => {
      if (index >= queue.length) {
        setAnimIdx(null);
        return;
      }

      const idx = queue[index];
      setDisplayed((current) => {
        const chars = Array.from(current);
        chars[idx] = masked[idx];
        return chars.join("");
      });
      
      setAnimIdx(idx);
      index++;
      
      timerRef.current = window.setTimeout(step, revealDelayMs);
    };

    // Start with a small delay for consistent timing
    timerRef.current = window.setTimeout(step, revealDelayMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masked, revealDelayMs]);

  // Render: word-aware wrapping (no mid-word breaks)
  const words = displayed.split(" ").filter(Boolean);

  const baseLetter = "text-xl sm:text-2xl font-mono font-semibold";
  const baseTileW = "w-8 sm:w-10";
  const letterH = "h-7 sm:h-8";

  // Map word+char to global index in `displayed`
  let scan = 0;

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
      {words.map((word, wIdx) => {
        while (displayed[scan] === " ") scan++;
        const wordStart = scan;
        scan = wordStart + word.length + 1;

        return (
          <div key={wIdx} className="inline-flex items-end gap-2 whitespace-nowrap mr-4">
            {Array.from(word).map((ch, i) => {
              const globalIdx = wordStart + i;
              
              // punctuation/numbers render inline, no underline slot
              if (ch !== "_" && !isAZ(ch)) {
                return (
                  <span
                    key={i}
                    className="text-xl sm:text-2xl font-mono text-zinc-800 dark:text-zinc-200"
                  >
                    {ch}
                  </span>
                );
              }

              const revealed = ch !== "_" && isAZ(ch);
              const isAnimating = animIdx === globalIdx;

              return (
                <span key={i} className={`flex flex-col items-center ${baseTileW}`}>
                  {/* letter area (reserved height) */}
                  <span className={`${letterH} flex items-center justify-center`}>
                    <span
                      className={[

                        baseLetter,
                        "transition-all duration-200 emoji-safe ease-out",
                        revealed ? "opacity-100" : "opacity-0",
                        // slide-up on newly revealed letters
                        isAnimating ? "translate-y-0" : revealed ? "translate-y-0" : "translate-y-1",
                      ].join(" ")}
                    >
                      {revealed ? ch : "A" /* placeholder for stable layout */}
                    </span>
                  </span>

                  {/* underline */}
                  <span
                    className={[
                      "w-full border-b-2 transition-colors duration-200 ease-out",
                      isAnimating
                        ? "border-zinc-900 dark:border-zinc-100"
                        : "border-zinc-600 dark:border-zinc-400",
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
