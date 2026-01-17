import { TileStatus } from "@playseed/game-core";
const GAME_URL = "https://www.decide-learn-do.com/wurple";
const TILE_EMOJI: Record<TileStatus, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};
export type challengeRatingLabel = {
  max: number;
  min?: number;
  label: string;
};
export const CHALLENGE_RATINGS = [
  { max: 5,  label: "Chromatic Savant 🧠✨" },
  { max: 8,  label: "Color Whisperer 🎯" },
  { max: 12, label: "Dialed In 🔥" },
  { max: 18, label: "Steady Solver 🧩" },
  { max: 30, label: "Persistent 💪" },
  { max: Infinity, label: "You Refused to Quit 🫡", min: 31 },
] as const;

export function challengeRating(guesses: number) {
  for (const r of CHALLENGE_RATINGS) {
    if (guesses <= r.max) return r.label;
  }
  return CHALLENGE_RATINGS.at(-1)!.label;
}

function buildShareUrl(opts: {
  origin: string;
  seed: string; // YYYY-MM-DD
  mode: "easy" | "challenge";
  isToday: boolean;
}) {
  const { origin, seed, mode, isToday } = opts;
  const path = isToday ? "/wurple" : `/wurple/archive/${seed}`;
  const url = new URL(path, origin);
  url.searchParams.set("mode", mode);
  return url.toString();
}

export function buildShareText(opts: {
  date: string;
  mode: "easy" | "challenge";
  status: "won" | "lost";
  maxGuesses: number | null;
  feedbackHistory: { tiles?: TileStatus[] }[];
}) {
  const { date, mode, status, maxGuesses, feedbackHistory } = opts;
     const attempts =
    status === "won"
      ? feedbackHistory.length
      : "X";

    const header =
        maxGuesses != null
        ? `Wurple ${date} • (${mode[0].toUpperCase() + mode.slice(1)}) • ${attempts}/${maxGuesses}`
        : `Wurple ${date} • (${mode[0].toUpperCase() + mode.slice(1)}) •  ${feedbackHistory.length} guesses`;

    const shareUrl = buildShareUrl({
      origin: GAME_URL,
      seed: date,
      mode,
      isToday: date === new Date().toISOString().slice(0, 10),
    });

    const rowsDisplay = feedbackHistory
        .filter(r => r.tiles)
        .map(r => r.tiles!.map(t => TILE_EMOJI[t]).join(""))
        
    const rows = feedbackHistory.length <=6 ? rowsDisplay.join("\n") : [...rowsDisplay.slice(0,3), `... (${feedbackHistory.length - 6} more)`, ...rowsDisplay.slice(-3)].join("\n");
  if(status === "won" && mode === "challenge") {
    const rating =
    mode === "challenge"
    ? `\nRating: ${challengeRating(feedbackHistory.length)}`
    : "";

    return `${header}${rating}\n\n${rows}\n\n${shareUrl}`;
  }


  return `${header}\n\n${rows}\n\n${shareUrl}`;
}
