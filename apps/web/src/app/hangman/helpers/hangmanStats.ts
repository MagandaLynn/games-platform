export type HangmanStatus = "playing" | "won" | "lost";

export type HangmanGameRecord = {
  puzzleKey: string;          // e.g. "hangman:daily:2026-01-17" or puzzleId
  completedAtISO: string;     // ISO timestamp
  status: Exclude<HangmanStatus, "playing">; // won | lost
  wrongGuesses: number;       // 0..maxWrong
  maxWrong: number;           // usually 6
  hintUsed: boolean;
};

const STORAGE_KEY = "playseed:hangman:records:v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadHangmanRecords(): HangmanGameRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<HangmanGameRecord[]>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed)) return [];
  // Basic shape guard
  return parsed.filter((r) => r && typeof r.puzzleKey === "string" && typeof r.completedAtISO === "string");
}

export function saveHangmanRecords(records: HangmanGameRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/**
 * Upsert: one record per puzzleKey (prevents double-counting).
 * If the user replays a puzzle, we keep the latest completion.
 */
export function upsertHangmanRecord(next: HangmanGameRecord) {
  const records = loadHangmanRecords();
  const idx = records.findIndex((r) => r.puzzleKey === next.puzzleKey);
  if (idx >= 0) records[idx] = next;
  else records.push(next);

  // Keep newest last (nice for streak calc + display)
  records.sort((a, b) => a.completedAtISO.localeCompare(b.completedAtISO));
  saveHangmanRecords(records);
}

export type HangmanStats = {
  played: number;
  wins: number;
  losses: number;
  winRate: number;          // 0..100
  currentStreak: number;
  maxStreak: number;
  hintUsedCount: number;
  // distribution keyed by wrongGuesses number
  distribution: Record<number, number>;
  maxWrong: number;         // for rendering bars 0..maxWrong
};

function toDateKey(iso: string) {
  // YYYY-MM-DD
  return iso.slice(0, 10);
}

export function computeHangmanStats(records: HangmanGameRecord[]): HangmanStats {
  const completed = records
    .filter((r) => r.status === "won" || r.status === "lost")
    .slice()
    .sort((a, b) => a.completedAtISO.localeCompare(b.completedAtISO));

  const played = completed.length;
  const wins = completed.filter((r) => r.status === "won").length;
  const losses = played - wins;
  const winRate = played === 0 ? 0 : Math.round((wins / played) * 100);

  const hintUsedCount = completed.filter((r) => r.hintUsed).length;

  // Assume maxWrong consistent; fall back to 6
  const maxWrong = completed[completed.length - 1]?.maxWrong ?? 6;

  const distribution: Record<number, number> = {};
  for (const r of completed) {
    const k = r.wrongGuesses;
    distribution[k] = (distribution[k] ?? 0) + 1;
  }

  // Streak logic (daily puzzles): count consecutive days with wins.
  // If you later support arbitrary puzzle IDs, this still works as “consecutive completion days”.
  let currentStreak = 0;
  let maxStreak = 0;

  // Build a map of dateKey -> best result for that day (won beats lost)
  const byDay = new Map<string, "won" | "lost">();
  for (const r of completed) {
    const day = toDateKey(r.completedAtISO);
    const prev = byDay.get(day);
    if (prev === "won") continue;
    byDay.set(day, r.status); // if prev lost, won can overwrite later because of sorting
  }

  const days = Array.from(byDay.keys()).sort(); // YYYY-MM-DD sorts lexicographically
  // Compute max streak
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const res = byDay.get(day)!;

    if (res !== "won") {
      streak = 0;
      continue;
    }

    if (i === 0) {
      streak = 1;
    } else {
      const prev = days[i - 1];
      const dPrev = new Date(prev + "T00:00:00");
      const dCur = new Date(day + "T00:00:00");
      const diffDays = Math.round((+dCur - +dPrev) / (1000 * 60 * 60 * 24));
      streak = diffDays === 1 ? streak + 1 : 1;
    }

    if (streak > maxStreak) maxStreak = streak;
  }

  // Current streak: walk backward from the most recent day
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    const res = byDay.get(day)!;
    if (res === "won") currentStreak++;
    else break;
  }

  return {
    played,
    wins,
    losses,
    winRate,
    currentStreak,
    maxStreak,
    hintUsedCount,
    distribution,
    maxWrong,
  };
}
