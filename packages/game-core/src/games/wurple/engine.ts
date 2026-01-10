import type { GameState, InternalGameResult } from "./types";
import { selectDailyHexSolution } from "./selectSolution";

function isValidHexGuess(s: string): boolean {
  return /^[0-9A-F]{6}$/.test(s);
}

function hasNoRepeatedChars(s: string): boolean {
  return new Set(s).size === s.length;
}

export function createInitialState(dateSeed: string | number): GameState {
  return {
    solution: selectDailyHexSolution(dateSeed),
    guesses: [],
    maxGuesses: 6,
  };
}

export function applyGuess(state: GameState, guess: string): GameState {
  if (isGameOver(state)) return state;

  const normalized = guess.trim().toUpperCase();

  if (!isValidHexGuess(normalized)) {
    throw new Error("Invalid guess: must be 6 hex characters (0-9, A-F).");
  }

  if (!hasNoRepeatedChars(normalized)) {
    throw new Error("Invalid guess: repeated hex digits are not allowed.");
  }

  return {
    ...state,
    guesses: [...state.guesses, normalized],
  };
}
export function isWin(state: GameState): boolean {
  const last = state.guesses[state.guesses.length - 1];
  return !!last && last === state.solution;
}

export function isGameOver(state: GameState): boolean {
  const last = state.guesses[state.guesses.length - 1];
  if (last === state.solution) return true;
  return state.guesses.length >= state.maxGuesses;
}

export function getInternalResult(state: GameState): InternalGameResult {
  const guessesUsed = state.guesses.length;

  if (!isGameOver(state)) return { status: "playing", guessesUsed };
  if (isWin(state)) return { status: "won", guessesUsed };
  return { status: "lost", guessesUsed, solution: state.solution };
}
