

export type TileStatus = "correct" | "present" | "absent";

export type GuessFeedback = {
  guess: string;
  tiles: TileStatus[];
  distance?: number;
};

export type GuessResponse = {
  seed: string;
  guessCount: number;
  maxGuesses: number;
  status: "playing" | "won" | "lost";
  gameOver: boolean;
  rulesVersion: number;
  normalizedGuess: string;
  feedback: GuessFeedback;
};

export type PreviewStatus = "empty" | "pending"; // non-revealed states


export type KeyStatus = "unknown" | "absent" | "present" | "correct";

export type WurpleMode = "easy" | "challenge";


export type DailyResponse = {
  seed: string;
  mode: WurpleMode;
  maxGuesses: number | null;
  allowDuplicates: boolean;
  includeTiles: boolean;
  includeDistance: boolean;
  rulesVersion: number;
};

export type WurpleModeStats = {
  totalPlayed: number;
  totalCompleted: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  avgGuessesToWin: number;
  bestGuessCount: number | null;
  totalGuesses: number;
  firstTryWins: number;
  hardModeWins: number;
  lastPlayedAt: string | null;
  guessDistribution: Record<string, number>;
};

export type WurpleStatsResponse = {
  updatedAt: string;
  statsByMode: Record<WurpleMode, WurpleModeStats>;
};

type CompletionMode = "none" | "easy" | "challenge" | "both";
export type ArchiveMeta = {
  date: string; // YYYY-MM-DD
  mode: CompletionMode;
  // optional extras:
  easyGuesses?: number;
  challengeGuesses?: number;
};
