// packages/game-core/src/games/hangman/engine.ts

export type HangmanStatus = "playing" | "won" | "lost";

export type HangmanConfig = {
  /** Max wrong guesses allowed before loss */
  maxWrong: number;
  /** If true, repeated guesses do not count again */
  ignoreRepeatedGuesses?: boolean;
};

export type HangmanState = {
  phrase: string;        // normalized uppercase phrase (server-only)
  status: HangmanStatus;
  guessed: string[];     // guessed letters (A–Z), sorted
  wrongGuesses: number;
  maxWrong: number;
  lastGuess?: string;
  error?: string;
};

export type HangmanResult = {
  status: HangmanStatus;
  masked: string;        // e.g. "H_E__  W_R_D"
  guessed: string[];
  wrongGuesses: number;
  remaining: number;
  isComplete: boolean;
};

const DEFAULT_CONFIG: HangmanConfig = {
  maxWrong: 6,
  ignoreRepeatedGuesses: true,
};

/* ------------------ helpers ------------------ */

function normalizePhrase(input: string): string {
  return input.trim().toUpperCase();
}

function normalizeLetter(input: string): string | null {
  const s = input.trim().toUpperCase();
  if (s.length !== 1) return null;
  const code = s.charCodeAt(0);
  if (code < 65 || code > 90) return null; // A–Z
  return s;
}

function isLetter(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 65 && code <= 90;
}

/* ------------------ engine ------------------ */

export function createInitialState(
  phrase: string,
  config: Partial<HangmanConfig> = {}
): HangmanState {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const normalized = normalizePhrase(phrase);

  if (!normalized) {
    return {
      phrase: "",
      status: "lost",
      guessed: [],
      wrongGuesses: cfg.maxWrong,
      maxWrong: cfg.maxWrong,
      error: "Empty phrase",
    };
  }

  return {
    phrase: normalized,
    status: "playing",
    guessed: [],
    wrongGuesses: 0,
    maxWrong: cfg.maxWrong,
  };
}

export function getMaskedPhrase(state: HangmanState): string {
  const guessed = new Set(state.guessed);

  return state.phrase
    .split("")
    .map((ch) => {
      if (ch === " ") return " ";
      if (!isLetter(ch)) return ch; // punctuation & numbers revealed
      return guessed.has(ch) ? ch : "_";
    })
    .join("");
}

export function isSolved(state: HangmanState): boolean {
  const guessed = new Set(state.guessed);

  for (const ch of state.phrase) {
    if (ch === " " || !isLetter(ch)) continue;
    if (!guessed.has(ch)) return false;
  }
  return true;
}

export function isGameOver(state: HangmanState): boolean {
  return state.status !== "playing";
}

export function applyGuess(
  state: HangmanState,
  rawGuess: string,
  config: Partial<HangmanConfig> = {}
): HangmanState {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (state.status !== "playing") {
    return { ...state, error: "Game over" };
  }

  const guess = normalizeLetter(rawGuess);
  if (!guess) {
    return { ...state, error: "Invalid guess (A–Z only)" };
  }

  const already = state.guessed.includes(guess);
  if (already) {
    if (cfg.ignoreRepeatedGuesses) {
      return { ...state, lastGuess: guess, error: "Already guessed" };
    }
    return { ...state, lastGuess: guess, error: "Already guessed" };
  }

  const nextGuessed = [...state.guessed, guess].sort();
  const inPhrase = state.phrase.includes(guess);
  const wrongGuesses = state.wrongGuesses + (inPhrase ? 0 : 1);

  const interim: HangmanState = {
    ...state,
    guessed: nextGuessed,
    wrongGuesses,
    lastGuess: guess,
    error: undefined,
  };

  let status: HangmanStatus = "playing";
  if (wrongGuesses >= state.maxWrong) status = "lost";
  else if (isSolved(interim)) status = "won";

  return { ...interim, status };
}

export function getResult(state: HangmanState): HangmanResult {
  const masked = getMaskedPhrase(state);
  const remaining = Math.max(0, state.maxWrong - state.wrongGuesses);

  return {
    status: state.status,
    masked,
    guessed: [...state.guessed],
    wrongGuesses: state.wrongGuesses,
    remaining,
    isComplete: state.status !== "playing",
  };
}
