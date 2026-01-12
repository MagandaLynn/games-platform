export type GameState = {
  solution: string;
  guesses: string[];
  maxGuesses: number | null;
};

export type PublicGameResult =
  | { status: "playing"; guessesUsed: number }
  | { status: "won"; guessesUsed: number }
  | { status: "lost"; guessesUsed: number };

export type InternalGameResult =
  | { status: "playing"; guessesUsed: number }
  | { status: "won"; guessesUsed: number }
  | { status: "lost"; guessesUsed: number; solution: string };

export type TileStatus = "correct" | "present" | "absent";

export type GuessFeedback = {
  guess: string;
  tiles?: TileStatus[];
  distance?: number;
};

export type GameMode = "easy" | "challenge";

export type ModeConfig = {
  mode: GameMode;
  maxGuesses: number | null;        // null = unlimited
  allowDuplicates: boolean;
  includeDistance: boolean;
  includeTiles: boolean;            // correct/present/absent
  requireUniqueSolutionDigits: boolean; // ✅ in solution
};
export type DailyRun = {
  date: string;              // "2026-01-11"
  mode: "easy" | "challenge";
  rulesVersion: number;
  guessesUsed: number;
  status: "won" | "lost";
  // optional: bestDistance, timeMs, etc
};
