import { HEX_GRID } from "../helpers/constants";
import { canAppendHex, keyStyle, popStyle } from "../helpers/helpers";

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

export default function Keyboard({status, input, isSubmitting, heatmap, setInput, submitGuess, setError, lastKey, setLastKey, usedInCurrent, rules}: KeyboardOptions){
    
  return (
        <div style={{ marginTop: 18 }}>

    {/* 4x4 hex grid */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 44px)",
        gap: 8,
        justifyContent: "center",
      }}
    >
      {HEX_GRID.flat().map((k) => {
        const isUsed = !rules.allowDuplicates && usedInCurrent.has(k);


        return (
        <button
          key={k}
          type="button"

          disabled={status !== "playing" || isUsed || input.length >= 6}
          style={{
            ...keyStyle(heatmap[k] ?? "unknown"),
             ...(isUsed ? { opacity: 0.35, cursor: "not-allowed", filter: "grayscale(0.4)" } : null),
            ...popStyle(lastKey === k),
          }}
          onClick={() => {
            if (status !== "playing") return;

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

        >
          {k}
        </button>)
    })}
    </div>

    {/* Controls row */}
    <div
      style={{
        marginTop: 12,
        display: "flex",
        gap: 12,
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={() => setInput((prev) => prev.slice(0, -1))}
        disabled={status !== "playing" || input.length === 0}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          background: "#1f2937",
          color: "#e5e7eb",
          fontWeight: 700,
        }}
      >
        ⌫ Backspace
      </button>

      <button
        type="button"
        onClick={submitGuess}
        disabled={
          status !== "playing" ||
          input.length !== 6 ||
          isSubmitting
        }
        style={{
          padding: "10px 20px",
          borderRadius: 10,
          background:
            input.length === 6 && status === "playing"
              ? "#2563eb"
              : "#374151",
          color: "#fff",
          fontWeight: 800,
          letterSpacing: 0.5,
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
        
      )
}