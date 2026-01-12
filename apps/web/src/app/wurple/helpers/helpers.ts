import { COLS, HEX_KEYS, MAX_RGB_DISTANCE } from "./constants";
import { KeyStatus, TileStatus } from "./types";

export function toGuessColor(guess: string): string | null {
  const g = guess.trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(g) ? `#${g}` : null;
}

export function padGuess(g: string): string {
  return (g.toUpperCase() + " ".repeat(COLS)).slice(0, COLS);
}

export function rank(status: KeyStatus): number {
  switch (status) {
    case "unknown": return 0;
    case "absent": return 1;
    case "present": return 2;
    case "correct": return 3;
  }
}
export function popStyle(isPopped: boolean): React.CSSProperties {
  return isPopped
    ? {
        animation: "keyPop 140ms ease-out",
      }
    : {};
}

export function keyStyle(status: KeyStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.15)",
    userSelect: "none",
    cursor: "pointer",

    // animation/interaction feel
    transition: "transform 90ms ease, filter 90ms ease, background 120ms ease",
    willChange: "transform",
  };

  switch (status) {
    case "correct":
      return { ...base, background: "#22c55e", color: "#0b1b10" };
    case "present":
      return { ...base, background: "#eab308", color: "#1a1402" };
    case "absent":
      return { ...base, background: "#374151", color: "#f9fafb" };
    case "unknown":
    default:
      return { ...base, background: "#111827", color: "#e5e7eb" };
  }
}

export function buildHeatmap(
  feedbackHistory: { guess: string; tiles: ("correct" | "present" | "absent")[] }[]
): Record<string, KeyStatus> {
  const map: Record<string, KeyStatus> = {};
  for (const k of HEX_KEYS) map[k] = "unknown";

  for (const fb of feedbackHistory) {
    const guess = fb.guess.toUpperCase();

    for (let i = 0; i < Math.min(6, fb.tiles.length); i++) {
      const ch = guess[i];
      if (!ch) continue;

      const tile = fb.tiles[i];
      const next: KeyStatus =
        tile === "correct" ? "correct" :
        tile === "present" ? "present" :
        "absent";

      // keep the best status we've ever seen for that key
      if (rank(next) > rank(map[ch] ?? "unknown")) {
        map[ch] = next;
      }
    }
  }

  return map;
}
export function tileStyle(status: TileStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 44,
    height: 44,
    display: "grid",
    placeItems: "center",
    borderRadius: 8,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontWeight: 700,
    letterSpacing: 1,
    border: "1px solid rgba(255,255,255,0.15)",
    userSelect: "none",
  };

  switch (status) {
    case "correct":
      return { ...base, background: "#22c55e", color: "#0b1b10" }; // green
    case "present":
      return { ...base, background: "#eab308", color: "#1a1402" }; // yellow
    case "absent":
    default:
      return { ...base, background: "#374151", color: "#f9fafb" }; // gray
  }
}

export function pctFromDistance(d: number): number {
  const clamped = Math.max(0, Math.min(MAX_RGB_DISTANCE, d));
  // 0 distance = perfect, so invert (higher % is better/closer)
  return 1 - clamped / MAX_RGB_DISTANCE;
}
type TempTrend = "perfect" | "warmer" | "colder" | "same" | "first";

export function tempTrendFromDistances(
  prev: number | undefined,
  curr: number | undefined,
  epsilon = 0.25 // treat tiny changes as "same"
): { trend: TempTrend; deltaAbs: number } {
  if (typeof curr !== "number") return { trend: "first", deltaAbs: 0 };
  if (curr === 0) return { trend: "perfect", deltaAbs: 0 };
  if (typeof prev !== "number") return { trend: "first", deltaAbs: 0 };

  const delta = prev - curr; // positive => closer (warmer)
  const abs = Math.abs(delta);

  if (abs < epsilon) return { trend: "same", deltaAbs: abs };
  return delta > 0 ? { trend: "warmer", deltaAbs: abs } : { trend: "colder", deltaAbs: abs };
}

export function trendText(trend: TempTrend, deltaAbs: number) {
  switch (trend) {
    case "perfect":
      return "🎯 perfect";
    case "first":
      return "— first guess";
    case "same":
      return `😐 same (${deltaAbs.toFixed(1)})`;
    case "warmer":
      return `🔥 warmer (+${deltaAbs.toFixed(1)})`;
    case "colder":
      return `❄️ colder (-${deltaAbs.toFixed(1)})`;
  }
}

export function trendStyle(trend: TempTrend): React.CSSProperties {
  const base: React.CSSProperties = { fontWeight: 700, opacity: 0.9 };
  switch (trend) {
    case "warmer":
      return { ...base, color: "#f97316" }; // orange
    case "colder":
      return { ...base, color: "#60a5fa" }; // blue
    case "perfect":
      return { ...base, color: "#22c55e" }; // green
    case "same":
      return { ...base, color: "#e5e7eb" };
    case "first":
    default:
      return { ...base, color: "rgba(229,231,235,0.65)" };
  }
}

export function canAppendHex(prev: string, k: string) {
  if (prev.length >= 6) return false;
  const next = k.toUpperCase();
  const upperPrev = prev.toUpperCase();

  // prevent repeats
  if (upperPrev.includes(next)) return false;

  return true;
}

