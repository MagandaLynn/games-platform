export type Mode = "easy" | "challenge";

export type ModeStats = {
  totalPlayed: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
  winGuessCounts: Record<string, number>;
  completed: Record<string, { status: "won" | "lost"; guessCount: number; completedAt: string }>;
  lastWinDate?: string; // YYYY-MM-DD
};

export type WurpleStats = {
  updatedAt?: string;
  statsByMode: Record<Mode, ModeStats>;
};

const KEY = "wurple:stats:v2";

function emptyModeStats(): ModeStats {
  return {
    totalPlayed: 0,
    totalWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    winGuessCounts: {},
    completed: {},
  };
}

export function emptyStats(): WurpleStats {
  return {
    updatedAt: new Date().toISOString(),
    statsByMode: {
      easy: emptyModeStats(),
      challenge: emptyModeStats(),
    },
  };
}

export function loadStats(): WurpleStats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as Partial<WurpleStats>;

    const base = emptyStats();
    const sbm = parsed.statsByMode ?? ({} as any);

    return {
      ...base,
      ...parsed,
      statsByMode: {
        easy: { ...base.statsByMode.easy, ...(sbm.easy ?? {}) },
        challenge: { ...base.statsByMode.challenge, ...(sbm.challenge ?? {}) },
      },
    };
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: WurpleStats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ ...stats, updatedAt: new Date().toISOString() })
  );
}

export function resetStats() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isNextDay(prevISO: string, nextISO: string) {
  return addDaysISO(prevISO, 1) === nextISO;
}

export function recordCompletion(
  seed: string,
  mode: Mode,
  status: "won" | "lost",
  guessCount: number
): WurpleStats {
  const stats = loadStats();
  const m = stats.statsByMode[mode] ?? emptyModeStats();
  const key = seed; // per-mode already, so key can just be seed

  // already counted for this mode+seed
  if (m.completed[key]) return stats;

  const nextMode: ModeStats = {
    ...m,
    completed: {
      ...m.completed,
      [key]: { status, guessCount, completedAt: new Date().toISOString() },
    },
    totalPlayed: m.totalPlayed + 1,
  };

  if (status === "won") {
    nextMode.totalWins = m.totalWins + 1;

    const wc = { ...(m.winGuessCounts ?? {}) };
    wc[String(guessCount)] = (wc[String(guessCount)] ?? 0) + 1;
    nextMode.winGuessCounts = wc;

    if (!m.lastWinDate) {
      nextMode.currentStreak = 1;
    } else if (isNextDay(m.lastWinDate, seed)) {
      nextMode.currentStreak = m.currentStreak + 1;
    } else if (m.lastWinDate === seed) {
      nextMode.currentStreak = m.currentStreak;
    } else {
      nextMode.currentStreak = 1;
    }

    nextMode.lastWinDate = seed;
    nextMode.bestStreak = Math.max(m.bestStreak, nextMode.currentStreak);
  } else {
    nextMode.currentStreak = 0;
  }

  const next: WurpleStats = {
    ...stats,
    updatedAt: new Date().toISOString(),
    statsByMode: {
      ...stats.statsByMode,
      [mode]: nextMode,
    },
  };

  saveStats(next);
  return next;
}
