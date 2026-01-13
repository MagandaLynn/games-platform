"use client";

export type ArchiveByDate = Record<
  string,
  {
    easyCompleted: boolean;
    challengeCompleted: boolean;

    // NEW: in-progress indicators (only when not completed)
    easyInProgress?: boolean;
    challengeInProgress?: boolean;

    easyGuessesCount?: number;
    challengeGuessesCount?: number;

    easyStatus?: string;
    challengeStatus?: string;

    updatedAt?: number;
  }
>;

type WurpleSave = {
  seed: string;
  mode: "easy" | "challenge";
  guesses: string[];
  status: "playing" | "won" | "lost";
  updatedAt?: number;
};

const KEY_PREFIX = "playseed:wurple:";

export function loadArchiveFromLocalStorage(): ArchiveByDate {
  const out: ArchiveByDate = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;

    // Expected: playseed:wurple:{mode}:{seed}
    const parts = key.split(":");
    if (parts.length < 4) continue;

    const mode = parts[2] as string;
    const seed = parts.slice(3).join(":"); // defensive (in case seed ever contains ':')

    if ((mode !== "easy" && mode !== "challenge") || !seed) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    let parsed: WurpleSave;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    // Sanity check: ignore mismatched blobs
    if (parsed.seed !== seed || parsed.mode !== mode) continue;

    const guessesCount = Array.isArray(parsed.guesses) ? parsed.guesses.length : 0;

    // "completed" means finished (won or lost)
    const completed = parsed.status === "won" || parsed.status === "lost";

    // "in progress" means actively playing AND they've made at least one guess AND not completed
    const inProgress = parsed.status === "playing" && guessesCount > 0 && !completed;

    out[seed] ??= {
      easyCompleted: false,
      challengeCompleted: false,
    };

    if (mode === "easy") {
      out[seed].easyCompleted ||= completed;
      out[seed].easyGuessesCount = guessesCount;
      out[seed].easyStatus = parsed.status;

      // Only mark progress if not completed
      out[seed].easyInProgress = inProgress;
    } else {
      out[seed].challengeCompleted ||= completed;
      out[seed].challengeGuessesCount = guessesCount;
      out[seed].challengeStatus = parsed.status;

      out[seed].challengeInProgress = inProgress;
    }

    if (typeof parsed.updatedAt === "number") {
      out[seed].updatedAt = Math.max(out[seed].updatedAt ?? 0, parsed.updatedAt);
    }
  }

  return out;
}
