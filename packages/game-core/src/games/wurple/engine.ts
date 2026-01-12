import type { GameState, InternalGameResult, TileStatus, GuessFeedback, ModeConfig } from "./types";
import { selectDailyHexSolution } from "./selectSolution";

function isValidHexGuess(s: string): boolean {
  return /^[0-9A-F]{6}$/.test(s);
}

function hasNoRepeatedChars(s: string): boolean {
  return new Set(s).size === s.length;
}

export function createInitialState(dateSeed: string | number, cfg: ModeConfig): GameState {
const seedKey = `${dateSeed}|${cfg.mode}`;
const solution = selectDailyHexSolution(seedKey, { requireUniqueDigits: cfg.mode === "easy" });

  if (!isValidHexGuess(solution)) {
    throw new Error("Invalid solution: must be 6 hex characters (0-9, A-F).");
  }

  return {
    solution,
    guesses: [],
    maxGuesses: cfg.maxGuesses, // number | null
  };
}


export function applyGuess(state: GameState, guess: string, cfg: ModeConfig): GameState {
  if (isGameOver(state)) return state;

  const normalized = guess.trim().toUpperCase();

  if (!isValidHexGuess(normalized)) {
    throw new Error("Invalid guess: must be 6 hex characters (0-9, A-F).");
  }

  if (!cfg.allowDuplicates && !hasNoRepeatedChars(normalized)) {
    throw new Error("Invalid guess: repeated hex digits are not allowed.");
  }

  return { ...state, guesses: [...state.guesses, normalized] };
}

export function isWin(state: GameState): boolean {
  const last = state.guesses[state.guesses.length - 1];
  return !!last && last === state.solution;
}

export function isGameOver(state: GameState): boolean {
  if (isWin(state)) return true;
  if (state.maxGuesses == null) return false;
  return state.guesses.length >= state.maxGuesses;
}


export function getInternalResult(state: GameState, cfg: ModeConfig): InternalGameResult {
  const guessesUsed = state.guesses.length;

  if (!isGameOver(state)) return { status: "playing", guessesUsed };
  if (isWin(state)) return { status: "won", guessesUsed };

  // only possible if cfg.maxGuesses is a number
  return { status: "lost", guessesUsed, solution: state.solution };
}


export function colorDistance(solution: string, guess: string): number {
  const s = parseInt(solution, 16);
  const g = parseInt(guess, 16);

  const sr = (s >> 16) & 255, sg = (s >> 8) & 255, sb = s & 255;
  const gr = (g >> 16) & 255, gg = (g >> 8) & 255, gb = g & 255;

  const dr = sr - gr, dg = sg - gg, db = sb - gb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function getGuessFeedback(solution: string, guess: string, cfg: ModeConfig): GuessFeedback {
  const s = solution.trim().toUpperCase();
  const g = guess.trim().toUpperCase();

  if (s.length !== 6 || g.length !== 6) {
    throw new Error("Expected solution and guess to be 6 characters.");
  }

  const feedback: GuessFeedback = { guess: g };

  if (cfg.includeTiles) {
    const tiles: TileStatus[] = Array(6).fill("absent");
    const remaining = new Map<string, number>();

    for (let i = 0; i < 6; i++) {
      const sCh = s[i]!;
      const gCh = g[i]!;
      if (gCh === sCh) tiles[i] = "correct";
      else remaining.set(sCh, (remaining.get(sCh) ?? 0) + 1);
    }

    for (let i = 0; i < 6; i++) {
      if (tiles[i] === "correct") continue;
      const gCh = g[i]!;
      const count = remaining.get(gCh) ?? 0;
      if (count > 0) {
        tiles[i] = "present";
        remaining.set(gCh, count - 1);
      }
    }

    feedback.tiles = tiles;
  }

  if (cfg.includeDistance) {
    feedback.distance = colorDistance(s, g);
  }

  return feedback;
}

