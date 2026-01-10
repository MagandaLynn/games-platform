import { NextResponse } from "next/server";
import { games } from "@playseed/game-core";

// function normalizeSeedFromUrl(url: string): string {
//   const { searchParams } = new URL(url);
//   const seed = searchParams.get("seed");
//   // Default to today's UTC date if not provided (stable across users)
//   if (!seed) {
//     const d = new Date();
//     const yyyy = d.getUTCFullYear();
//     const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
//     const dd = String(d.getUTCDate()).padStart(2, "0");
//     return `${yyyy}-${mm}-${dd}`;
//   }
//   return seed.trim();
// }

// export async function GET(req: Request) {
//   const seed = normalizeSeedFromUrl(req.url);

//   // For now: no persistence -> initial state (0 guesses)
//   const state = createInitialState(seed);

//   // Return public metadata only (no solution)
//   return NextResponse.json(toPublicDaily(seed, state));
// }

type DailyResponse = {
  seed: string;            // "2026-01-06"
  maxGuesses: number;      // from game-core rules
  guessCount: number;      // usually 0 for new sessions; later from persistence
  gameOver: boolean;       // false initially
  rulesVersion: number;    // bump when scoring rules change
};

const RULES_VERSION = 1;

function seedFromRequest(url: URL) {
  const seed = url.searchParams.get("seed");
  if (seed) return seed;

  // Default seed = today in America/New_York as YYYY-MM-DD
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // "2026-01-06"
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seed = seedFromRequest(url);

  const state = games.wurple.createInitialState(seed);

return NextResponse.json({
  seed,
  maxGuesses: state.maxGuesses,
  guessCount: state.guesses.length,
  gameOver: false,
  rulesVersion: RULES_VERSION,
});

}
