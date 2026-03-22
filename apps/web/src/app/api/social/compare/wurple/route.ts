import { prisma } from "@playseed/db";
import { getDateRange, parseRange, resolveOrCreateProfile } from "../../_shared";

export const runtime = "nodejs";

type WurpleMode = "easy" | "challenge";

type DailyPoint = {
  date: string;
  attempted: boolean;
  completed: boolean;
  won: boolean;
  lost: boolean;
  wrongGuesses: number | null;
  guessedCount: number;
  hintUsed: boolean;
  perfect: boolean;
};

type ProfileRef = {
  id: string;
  handle: string;
  displayName: string | null;
  sessionId: string;
  userId: string | null;
};

type RawPlay = {
  seed: string;
  status: string;
  guessCount: number;
  updatedAt: Date;
};

function parseMode(input: string | null): WurpleMode {
  return input === "challenge" ? "challenge" : "easy";
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDaysUTC(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function buildAxisDates(from: Date, to: Date) {
  const out: string[] = [];
  let current = new Date(from);

  while (current <= to) {
    out.push(toDateKey(current));
    current = addDaysUTC(current, 1);
  }

  return out;
}

function isCompleted(status: string) {
  return status === "won" || status === "lost";
}

function wasAttempted(play: Pick<RawPlay, "guessCount" | "status">) {
  return play.guessCount > 0 || isCompleted(play.status);
}

function rankPlay(play: RawPlay) {
  const statusWeight = play.status === "won" ? 300 : play.status === "lost" ? 200 : 100;
  return statusWeight + Math.min(play.guessCount, 99);
}

function chooseBetterPlay(current: RawPlay | undefined, next: RawPlay) {
  if (!current) return next;

  const currentRank = rankPlay(current);
  const nextRank = rankPlay(next);

  if (nextRank !== currentRank) {
    return nextRank > currentRank ? next : current;
  }

  return next.updatedAt > current.updatedAt ? next : current;
}

async function collectForProfile(
  profile: ProfileRef,
  axisDates: string[],
  from: Date,
  to: Date,
  mode: WurpleMode
) {
  const plays = (await prisma.wurpleDailyPlay.findMany({
    where: {
      mode,
      date: { gte: from, lte: to },
      OR: [{ sessionId: profile.sessionId }, ...(profile.userId ? [{ userId: profile.userId }] : [])],
    },
    select: {
      seed: true,
      status: true,
      guessCount: true,
      updatedAt: true,
    },
    orderBy: [{ seed: "asc" }, { updatedAt: "desc" }],
  })) as RawPlay[];

  const bestPlayByDay = new Map<string, RawPlay>();

  for (const p of plays) {
    bestPlayByDay.set(p.seed, chooseBetterPlay(bestPlayByDay.get(p.seed), p));
  }

  const daily: DailyPoint[] = axisDates.map((date) => {
    const play = bestPlayByDay.get(date);
    const attempted = play ? wasAttempted(play) : false;
    const completed = play ? isCompleted(play.status) : false;
    const won = play?.status === "won";
    const lost = play?.status === "lost";
    const guessedCount = attempted && play ? play.guessCount : 0;
    const perfect = Boolean(won && guessedCount === 1);

    return {
      date,
      attempted,
      completed,
      won,
      lost,
      wrongGuesses: null,
      guessedCount,
      hintUsed: false,
      perfect,
    };
  });

  const attemptedDays = daily.filter((d) => d.attempted).length;
  const totalCompleted = daily.filter((d) => d.completed).length;
  const attemptedNotCompletedDays = daily.filter((d) => d.attempted && !d.completed).length;
  const totalWon = daily.filter((d) => d.won).length;
  const totalLost = daily.filter((d) => d.lost).length;
  const perfectCount = daily.filter((d) => d.perfect).length;
  const totalGuesses = daily.reduce((sum, d) => sum + (d.completed ? d.guessedCount : 0), 0);

  return {
    profileId: profile.id,
    handle: profile.handle,
    displayName: profile.displayName,
    summary: {
      totalPlayed: attemptedDays,
      totalCompleted,
      attemptedNotCompletedDays,
      totalWon,
      totalLost,
      perfectCount,
      avgWrongGuesses: 0,
      avgGuesses: totalCompleted ? Number((totalGuesses / totalCompleted).toFixed(2)) : 0,
      winRate: totalCompleted ? Number((totalWon / totalCompleted).toFixed(2)) : 0,
      hintUsageRate: 0,
      perfectRate: totalCompleted ? Number((perfectCount / totalCompleted).toFixed(2)) : 0,
    },
    daily,
  };
}

async function findEarliestDateForProfile(profile: ProfileRef, mode: WurpleMode, to: Date) {
  const first = await prisma.wurpleDailyPlay.findFirst({
    where: {
      mode,
      date: { lte: to },
      OR: [{ sessionId: profile.sessionId }, ...(profile.userId ? [{ userId: profile.userId }] : [])],
    },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  return first?.date ?? null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = parseMode(url.searchParams.get("mode"));
    const range = parseRange(url.searchParams.get("range"));
    const { from, to } = getDateRange(range);

    const me = await resolveOrCreateProfile();

    const follows = await prisma.socialFollow.findMany({
      where: { followerProfileId: me.id },
      include: { following: true },
      orderBy: { createdAt: "asc" },
      take: 25,
    });

    const axisFrom = from ?? (() => {
      const fallback = new Date(to);
      fallback.setUTCDate(fallback.getUTCDate() - 29);
      return fallback;
    })();

    if (!from) {
      const candidates = await Promise.all([
        findEarliestDateForProfile(me, mode, to),
        ...follows.map((f) => findEarliestDateForProfile(f.following, mode, to)),
      ]);

      const earliest = candidates
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      if (earliest) {
        axisFrom.setTime(earliest.getTime());
      }
    }

    const axisDates = buildAxisDates(axisFrom, to);
    const availableDays = axisDates.length;

    const meData = await collectForProfile(me, axisDates, axisFrom, to, mode);

    const followData = await Promise.all(
      follows.map((f) => collectForProfile(f.following, axisDates, axisFrom, to, mode))
    );

    return Response.json({
      range,
      from: axisFrom.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      availableDays,
      axisDates,
      me: meData,
      follows: followData,
    });
  } catch (e: any) {
    return Response.json(
      { error: "COMPARE_READ_FAILED", message: e?.message ?? "Failed to load compare data" },
      { status: 500 }
    );
  }
}
