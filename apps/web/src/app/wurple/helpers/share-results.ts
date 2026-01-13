import { TileStatus } from "@playseed/game-core";
const GAME_URL = "https://www.decide-learn-do.com/wurple";
const TILE_EMOJI: Record<TileStatus, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

function challengeRating(guesses: number) {
  if (guesses <= 5)  return "Chromatic Savant 🧠✨";
  if (guesses <= 8)  return "Color Whisperer 🎯";
  if (guesses <= 12) return "Dialed In 🔥";
  if (guesses <= 18) return "Steady Solver 🧩";
  if (guesses <= 30) return "Persistent 💪";
  if (guesses <= 50) return "Unstoppable 🏃";
  return "You Refused to Quit 🫡";
}


export function buildShareText(opts: {
  date: string;
  mode: "easy" | "challenge";
  status: "won" | "lost";
  maxGuesses: number | null;
  feedbackHistory: { tiles?: TileStatus[] }[];
}) {
  const { date, mode, status, maxGuesses, feedbackHistory } = opts;
  console.log("Max guesses in buildShareText:", maxGuesses);
    const attempts =
    status === "won"
      ? feedbackHistory.length
      : "X";

    const header =
        maxGuesses != null
        ? `Wurple ${date} (${mode[0].toUpperCase() + mode.slice(1)}) ${attempts}/${maxGuesses}`
        : `Wurple ${date} (${mode[0].toUpperCase() + mode.slice(1)}) ${feedbackHistory.length} guesses`;

    console.log("Feedback history in buildShareText:", feedbackHistory);
    
    const rowsDisplay = feedbackHistory
        .filter(r => r.tiles)
        .map(r => r.tiles!.map(t => TILE_EMOJI[t]).join(""))
        
    const rows = feedbackHistory.length <=6 ? rowsDisplay.join("\n") : [...rowsDisplay.slice(0,3), `... (${feedbackHistory.length - 6} more)`, ...rowsDisplay.slice(-3)].join("\n");
  if(status === "won" && mode === "challenge") {
    const rating =
    mode === "challenge"
    ? `\nRating: ${challengeRating(feedbackHistory.length)}`
    : "";

    return `${header}${rating}\n\n${rows}\n\n${GAME_URL}`;
  }


  return `${header}\n\n${rows}\n\n${GAME_URL}`;
}
