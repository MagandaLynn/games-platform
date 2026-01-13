import type { GuessFeedback } from "./helpers/types";

const PREFIX = "playseed:wurple";

export type PersistedRun = {
  seed: string;
  mode: "easy" | "challenge";
  guesses: string[];
  feedbackHistory: GuessFeedback[];
  status: "playing" | "won" | "lost";
  rulesVersion: number;
  updatedAt: number;
};

function keyFor(seed: string, mode: "easy" | "challenge") {
  return `${PREFIX}:${mode}:${seed}`;
}

export function loadRun(seed: string, mode: "easy" | "challenge"): PersistedRun | null {
  try {
    const raw = localStorage.getItem(keyFor(seed, mode));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedRun;
  } catch {
    return null;
  }
}

export function saveRun(run: PersistedRun) {
  try {
    localStorage.setItem(keyFor(run.seed, run.mode), JSON.stringify(run));
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearRun(seed: string, mode: "easy" | "challenge") {
  try {
    localStorage.removeItem(keyFor(seed, mode));
  } catch {}
}
