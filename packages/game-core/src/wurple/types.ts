export type GameState = {
  solution: string;     // 6-char hex, uppercase, e.g. "A1B2C3"
  guesses: string[];    // each 6-char hex, uppercase
  maxGuesses: number;   // e.g. 6
};

export type GameResult =
  | { status: "playing" }
  | { status: "won"; guessesUsed: number }
  | { status: "lost"; solution: string };