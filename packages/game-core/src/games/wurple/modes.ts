import { GameMode, ModeConfig } from "./types";

export const MODE_CONFIG: Record<GameMode, ModeConfig> = {
  easy: {
    mode: "easy",
    maxGuesses: 6,
    allowDuplicates: false,
    includeTiles: true,
    includeDistance: false,
    requireUniqueSolutionDigits: true,
  },
  challenge: {
    mode: "challenge",
    maxGuesses: null,
    allowDuplicates: true,
    includeTiles: true,     // or true if you want hybrid
    includeDistance: true,
    requireUniqueSolutionDigits: false,
  },
};
