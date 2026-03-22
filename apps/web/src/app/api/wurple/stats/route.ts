import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

type WurpleMode = "easy" | "challenge";
type WurpleStatus = "playing" | "won" | "lost";

type StatsByMode = {
  totalPlayed: number;
  totalCompleted: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  avgGuessesToWin: number;
  bestGuessCount: number | null;
  totalGuesses: number;
  firstTryWins: number;
  hardModeWins: number;
  lastPlayedAt: string | null;
  guessDistribution: Record<string, number>;
};

type StatsResponse = {
  updatedAt: string;
  statsByMode: Record<WurpleMode, StatsByMode>;
};

type Row = {
  seed: string;
  status: string;
  guessCount: number;
  updatedAt: Date;
  completedAt: Date | null;
  mode: string;
};

function emptyModeStats(): StatsByMode {
  return {
    totalPlayed: 0,
    totalCompleted: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    avgGuessesToWin: 0,
    bestGuessCount: null,
    totalGuesses: 0,
    firstTryWins: 0,
    hardModeWins: 0,
    lastPlayedAt: null,
    guessDistribution: {},
  };
}

function chooseBetterPlay(current: Row | undefined, next: Row) {
  if (!current) return next;

  const rank = (play: Row) => {
    const statusWeight = play.status === "won" ? 300 : play.status === "lost" ? 200 : 100;
    const guessWeight = Math.min(play.guessCount, 99);
    return statusWeight + guessWeight;
  };

  const currentRank = rank(current);
  const nextRank = rank(next);

  if (nextRank !== currentRank) {
    return nextRank > currentRank ? next : current;
  }

  return next.updatedAt > current.updatedAt ? next : current;
}

function completedStatus(status: string): WurpleStatus {
  if (status === "won" || status === "lost") return status;
  return "playing";
}

function computeModeStats(mode: WurpleMode, rows: Row[]): StatsByMode {
  const byDay = new Map<string, Row>();

  for (const row of rows) {
    byDay.set(row.seed, chooseBetterPlay(byDay.get(row.seed), row));
  }

  const plays = Array.from(byDay.values()).sort((a, b) => a.seed.localeCompare(b.seed));
  const stats = emptyModeStats();

  stats.totalPlayed = plays.filter((play) => play.guessCount > 0 || play.status !== "playing").length;
  stats.totalCompleted = plays.filter((play) => play.status === "won" || play.status === "lost").length;
  stats.totalWins = plays.filter((play) => play.status === "won").length;
  stats.totalLosses = plays.filter((play) => play.status === "lost").length;
  stats.winRate = stats.totalCompleted > 0 ? Number((stats.totalWins / stats.totalCompleted).toFixed(4)) : 0;
  stats.totalGuesses = plays.reduce((sum, play) => sum + (play.status === "won" ? play.guessCount : 0), 0);

  const wins = plays.filter((play) => play.status === "won");
  if (wins.length > 0) {
    stats.avgGuessesToWin = Number((wins.reduce((sum, play) => sum + play.guessCount, 0) / wins.length).toFixed(2));
    stats.bestGuessCount = Math.min(...wins.map((play) => play.guessCount));
    stats.firstTryWins = wins.filter((play) => play.guessCount === 1).length;

    for (const win of wins) {
      const key = String(win.guessCount);
      stats.guessDistribution[key] = (stats.guessDistribution[key] ?? 0) + 1;
    }
  }

  if (mode === "challenge") {
    stats.hardModeWins = stats.totalWins;
  }

  const completed = plays.filter((play) => {
    const status = completedStatus(play.status);
    return status === "won" || status === "lost";
  });

  let rolling = 0;
  for (const play of completed) {
    if (play.status === "won") {
      rolling += 1;
      stats.bestStreak = Math.max(stats.bestStreak, rolling);
    } else {
      rolling = 0;
    }
  }

  stats.currentStreak = rolling;

  const lastPlayed = plays.at(-1);
  if (lastPlayed) {
    const timestamp = lastPlayed.completedAt ?? lastPlayed.updatedAt;
    stats.lastPlayedAt = timestamp.toISOString();
  }

  return stats;
}

export async function GET() {
  const sessionId = await requireSessionId();
  const { userId } = await auth();

  const rows = (await prisma.wurpleDailyPlay.findMany({
    where: {
      OR: [{ sessionId }, ...(userId ? [{ userId }] : [])],
    },
    select: {
      seed: true,
      mode: true,
      status: true,
      guessCount: true,
      updatedAt: true,
      completedAt: true,
    },
    orderBy: [{ seed: "asc" }, { updatedAt: "desc" }],
  })) as Row[];

  const easyRows = rows.filter((row) => row.mode === "easy");
  const challengeRows = rows.filter((row) => row.mode === "challenge");

  const response: StatsResponse = {
    updatedAt: new Date().toISOString(),
    statsByMode: {
      easy: computeModeStats("easy", easyRows),
      challenge: computeModeStats("challenge", challengeRows),
    },
  };

  return Response.json(response);
}
