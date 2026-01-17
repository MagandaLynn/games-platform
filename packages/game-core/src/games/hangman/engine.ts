export type HangmanStatus = "playing" | "won" | "lost";

export type HangmanConfig = {
  maxWrong: number;
  ignoreRepeatedGuesses?: boolean;
};

export type HangmanState = {
  phrase: string; // normalized uppercase phrase (server-only)
  status: HangmanStatus;
  guessed: string[]; // guessed letters (A–Z), sorted
  wrongGuesses: number;
  maxWrong: number;
  ignoreRepeatedGuesses: boolean;
  lastGuess?: string;
  error?: string;
};

export type HangmanResult = {
  status: HangmanStatus;
  masked: string;        // raw mask: e.g. "H_E__  W_R_D"
  maskedDisplay: string; // display mask: e.g. "H _ E _ _  W _ R _ D" (or punctuation spaced)
  guessed: string[];
  wrongGuesses: number;
  remaining: number;
  isComplete: boolean;
};

export type HangmanPublicState = {
  keyboard: HangmanKeyboardState;
  status: HangmanStatus;
  masked: string;
  guessed: string[];
  wrongGuesses: number;
  remaining: number;
  maxWrong: number;
  lastGuess?: string;
  error?: string;
  isComplete: boolean;
};

export type HangmanKeyStatus = "unused" | "correct" | "incorrect" | "locked";

export type HangmanKeyboardState = Record<string, HangmanKeyStatus>;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function getKeyboardState(state: HangmanState): HangmanKeyboardState {
  const guessed = new Set(state.guessed);
  const isOver = state.status !== "playing";

  // Precompute which letters in phrase are actually “correct” targets
  const inPhrase = new Set<string>();
  for (const ch of state.phrase) {
    if (isLetter(ch)) inPhrase.add(ch);
  }

  const keyboard: HangmanKeyboardState = {};

  for (const letter of ALPHABET) {
if (isOver) {
  if (!guessed.has(letter)) keyboard[letter] = "locked";
  else keyboard[letter] = inPhrase.has(letter) ? "correct" : "incorrect";
  continue;
}


    if (!guessed.has(letter)) {
      keyboard[letter] = "unused";
      continue;
    }

    keyboard[letter] = inPhrase.has(letter) ? "correct" : "incorrect";
  }

  return keyboard;
}


export function toPublicState(state: HangmanState): HangmanPublicState {
  const masked = getMaskedPhrase(state);
  const remaining = Math.max(0, state.maxWrong - state.wrongGuesses);

  return {
    keyboard: getKeyboardState(state),
    status: state.status,
    masked,
    guessed: [...state.guessed],
    wrongGuesses: state.wrongGuesses,
    remaining,
    maxWrong: state.maxWrong,
    lastGuess: state.lastGuess,
    error: state.error,
    isComplete: state.status !== "playing",
  };
}

const DEFAULT_CONFIG: HangmanConfig = {
  maxWrong: 6,
  ignoreRepeatedGuesses: true,
};

/* ------------------ helpers ------------------ */

function normalizePhrase(input: string): string {
  // trim + collapse whitespace + uppercase
  return input.trim().replace(/\s+/g, " ").toUpperCase();
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

// Optional: punctuation spacing for nicer readability / your earlier test expectation
function isPunctuation(ch: string): boolean {
  // Keep simple: anything that's not a letter/space/underscore counts as punctuation for display
  return ch !== " " && ch !== "_" && !isLetter(ch) && ch.length === 1;
}

function formatMaskedForDisplay(masked: string): string {
  // Insert spaces around punctuation, and between adjacent underscores/letters if you like.
  // This version only spaces punctuation: "__, ___!" -> "__ , ___ !"
  const out: string[] = [];
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
  if (!ch) continue;

    if (isPunctuation(ch)) {
      // Ensure space before punctuation if previous isn't space
      if (out.length > 0 && out[out.length - 1] !== " ") out.push(" ");
      out.push(ch);
      // Ensure space after punctuation if next isn't space/end
      if (i < masked.length - 1 && masked[i + 1] !== " ") out.push(" ");
      continue;
    }

    out.push(ch);
  }
  return out.join("").replace(/\s+/g, " ").trimEnd();
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
      ignoreRepeatedGuesses: cfg.ignoreRepeatedGuesses ?? true,
      error: "Empty phrase",
    };
  }

  return {
    phrase: normalized,
    status: "playing",
    guessed: [],
    wrongGuesses: 0,
    maxWrong: cfg.maxWrong,
    ignoreRepeatedGuesses: cfg.ignoreRepeatedGuesses ?? true,
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

export function getMaskedPhraseDisplay(state: HangmanState): string {
  return formatMaskedForDisplay(getMaskedPhrase(state));
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

export function applyGuess(state: HangmanState, rawGuess: string): HangmanState {
  if (state.status !== "playing") {
    return { ...state, error: "Game over" };
  }

  const guess = normalizeLetter(rawGuess);
  if (!guess) {
    return { ...state, error: "Invalid guess (A–Z only)" };
  }

  const already = state.guessed.includes(guess);
  if (already) {
    if (state.ignoreRepeatedGuesses) {
      return { ...state, lastGuess: guess, error: "Already guessed" };
    }

    const wrongGuesses = state.wrongGuesses + 1;
    const status: HangmanStatus =
      wrongGuesses >= state.maxWrong ? "lost" : "playing";

    return {
      ...state,
      wrongGuesses,
      status,
      lastGuess: guess,
      error: "Already guessed",
    };
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
    maskedDisplay: formatMaskedForDisplay(masked),
    guessed: [...state.guessed],
    wrongGuesses: state.wrongGuesses,
    remaining,
    isComplete: state.status !== "playing",
  };
}

