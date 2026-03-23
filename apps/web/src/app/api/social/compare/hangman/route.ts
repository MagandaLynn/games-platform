import { prisma } from "@playseed/db";
import { getBlockedProfileIds, getBlockingProfileIds, getDateRange, parseRange, resolveOrCreateProfile } from "../../_shared";

export const runtime = "nodejs";
const MAX_LOOKBACK_DAYS = 365;

type DailyPoint = {
  date: string;
  hangmanInstanceId?: string | null;
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
  status: string;
  wrongGuesses: number;
  guessed: string;
  hintUsed: boolean;
  updatedAt: Date;
  instance: {
    id: string;
    date: Date;
  };
};

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDaysUTC(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function getCappedFrom(from: Date, to: Date) {
  const minFrom = addDaysUTC(to, -(MAX_LOOKBACK_DAYS - 1));
  return from < minFrom ? minFrom : from;
}

function isCompleted(status: string) {
  return status === "won" || status === "lost";
}

function wasAttempted(play: Pick<RawPlay, "guessed" | "hintUsed">) {
  return play.guessed.length > 0 || play.hintUsed;
}

function rankPlay(play: RawPlay) {
  return (isCompleted(play.status) ? 100 : 0) + (wasAttempted(play) ? 10 : 0) + play.guessed.length;
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
  from: Date | null,
  to: Date
) {
  const whereDate = from
    ? { gte: from, lte: to }
    : { lte: to };

  const plays = (await prisma.hangmanPlay.findMany({
    where: {
      OR: [
        { sessionId: profile.sessionId },
        ...(profile.userId ? [{ userId: profile.userId }] : []),
      ],
      instance: {
        mode: "daily",
        date: whereDate,
      },
    },
    include: {
      instance: {
        select: {
          id: true,
          date: true,
        },
      },
    },
    orderBy: [{ instance: { date: "asc" } }, { updatedAt: "desc" }],
  })) as RawPlay[];

  const bestPlayByDay = new Map<string, RawPlay>();

  for (const p of plays) {
    const day = toDateKey(p.instance.date);
    bestPlayByDay.set(day, chooseBetterPlay(bestPlayByDay.get(day), p));
  }

  const daily: DailyPoint[] = axisDates.map((date) => {
    const play = bestPlayByDay.get(date);
    const attempted = play ? wasAttempted(play) : false;
    const completed = play ? isCompleted(play.status) : false;
    const won = play?.status === "won";
    const lost = play?.status === "lost";
    const guessedCount = attempted && play ? play.guessed.length : 0;
    const wrongGuesses = attempted && play ? play.wrongGuesses : null;
    const hintUsed = Boolean(play?.hintUsed);
    const perfect = Boolean(won && wrongGuesses === 0 && !hintUsed);
    const hangmanInstanceId = play?.instance.id ?? null;

    return {
      date,
      hangmanInstanceId,
      attempted,
      completed,
      won,
      lost,
      wrongGuesses,
      guessedCount,
      hintUsed,
      perfect,
    };
  });

  const attemptedDays = daily.filter((d) => d.attempted).length;
  const totalCompleted = daily.filter((d) => d.completed).length;
  const attemptedNotCompletedDays = daily.filter((d) => d.attempted && !d.completed).length;
  const totalWon = daily.filter((d) => d.won).length;
  const totalLost = daily.filter((d) => d.lost).length;
  const perfectCount = daily.filter((d) => d.perfect).length;
  const totalWrong = daily.reduce((sum, d) => sum + (d.completed && d.wrongGuesses !== null ? d.wrongGuesses : 0), 0);
  const totalGuesses = daily.reduce((sum, d) => sum + (d.completed ? d.guessedCount : 0), 0);
  const hintUsedCount = daily.filter((d) => d.completed && d.hintUsed).length;

  const summary = {
    totalPlayed: attemptedDays,
    totalCompleted,
    attemptedNotCompletedDays,
    totalWon,
    totalLost,
    perfectCount,
    avgWrongGuesses: totalCompleted ? Number((totalWrong / totalCompleted).toFixed(2)) : 0,
    avgGuesses: totalCompleted ? Number((totalGuesses / totalCompleted).toFixed(2)) : 0,
    winRate: totalCompleted ? Number((totalWon / totalCompleted).toFixed(2)) : 0,
    hintUsageRate: totalCompleted ? Number((hintUsedCount / totalCompleted).toFixed(2)) : 0,
    perfectRate: totalCompleted ? Number((perfectCount / totalCompleted).toFixed(2)) : 0,
  };

  return {
    profileId: profile.id,
    handle: profile.handle,
    displayName: profile.displayName,
    summary,
    daily,
  };
}

async function collectLifetimeSummaryForProfile(profile: ProfileRef, to: Date) {
  const plays = (await prisma.hangmanPlay.findMany({
    where: {
      OR: [
        { sessionId: profile.sessionId },
        ...(profile.userId ? [{ userId: profile.userId }] : []),
      ],
      instance: {
        mode: "daily",
        date: { lte: to },
      },
    },
    include: {
      instance: {
        select: {
          id: true,
          date: true,
        },
      },
    },
    orderBy: [{ instance: { date: "asc" } }, { updatedAt: "desc" }],
  })) as RawPlay[];

  const bestPlayByDay = new Map<string, RawPlay>();
  for (const p of plays) {
    const day = toDateKey(p.instance.date);
    bestPlayByDay.set(day, chooseBetterPlay(bestPlayByDay.get(day), p));
  }

  const daily: DailyPoint[] = Array.from(bestPlayByDay.values()).map((play) => {
    const attempted = wasAttempted(play);
    const completed = isCompleted(play.status);
    const won = play.status === "won";
    const lost = play.status === "lost";
    const guessedCount = attempted ? play.guessed.length : 0;
    const wrongGuesses = attempted ? play.wrongGuesses : null;
    const hintUsed = Boolean(play.hintUsed);
    const perfect = Boolean(won && wrongGuesses === 0 && !hintUsed);

    return {
      date: toDateKey(play.instance.date),
      hangmanInstanceId: play.instance.id,
      attempted,
      completed,
      won,
      lost,
      wrongGuesses,
      guessedCount,
      hintUsed,
      perfect,
    };
  });

  const attemptedDays = daily.filter((d) => d.attempted).length;
  const totalCompleted = daily.filter((d) => d.completed).length;
  const attemptedNotCompletedDays = daily.filter((d) => d.attempted && !d.completed).length;
  const totalWon = daily.filter((d) => d.won).length;
  const totalLost = daily.filter((d) => d.lost).length;
  const perfectCount = daily.filter((d) => d.perfect).length;
  const totalWrong = daily.reduce((sum, d) => sum + (d.completed && d.wrongGuesses !== null ? d.wrongGuesses : 0), 0);
  const totalGuesses = daily.reduce((sum, d) => sum + (d.completed ? d.guessedCount : 0), 0);
  const hintUsedCount = daily.filter((d) => d.completed && d.hintUsed).length;

  return {
    totalPlayed: attemptedDays,
    totalCompleted,
    attemptedNotCompletedDays,
    totalWon,
    totalLost,
    perfectCount,
    avgWrongGuesses: totalCompleted ? Number((totalWrong / totalCompleted).toFixed(2)) : 0,
    avgGuesses: totalCompleted ? Number((totalGuesses / totalCompleted).toFixed(2)) : 0,
    winRate: totalCompleted ? Number((totalWon / totalCompleted).toFixed(2)) : 0,
    hintUsageRate: totalCompleted ? Number((hintUsedCount / totalCompleted).toFixed(2)) : 0,
    perfectRate: totalCompleted ? Number((perfectCount / totalCompleted).toFixed(2)) : 0,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = parseRange(url.searchParams.get("range"));
    const { from, to } = getDateRange(
      range,
      url.searchParams.get("from"),
      url.searchParams.get("to")
    );

    const me = await resolveOrCreateProfile();

    const [blockedByMe, blockedByOthers] = await Promise.all([
      getBlockedProfileIds(me.id),
      getBlockingProfileIds(me.id),
    ]);

    const blockedIds = new Set<string>([
      ...blockedByMe,
      ...blockedByOthers,
    ]);

    const follows = await prisma.socialFollow.findMany({
      where: { followerProfileId: me.id },
      include: { following: true },
      orderBy: { createdAt: "asc" },
      take: 25,
    });

    const filteredFollows = follows.filter((f) => !blockedIds.has(f.followingProfileId));

    const requestedFrom = from ?? addDaysUTC(to, -29);
    const axisFrom = getCappedFrom(requestedFrom, to);
    const isCapped = requestedFrom < axisFrom;

    const schedules = await prisma.hangmanDailySchedule.findMany({
      where: { date: { gte: axisFrom, lte: to } },
      orderBy: { date: "asc" },
      select: { date: true },
    });

    const axisDates = schedules.map((schedule) => toDateKey(schedule.date));
    const availableDays = axisDates.length;

    const meData = await collectForProfile(me, axisDates, axisFrom, to);

    const followData = await Promise.all(
      filteredFollows.map((f) => collectForProfile(f.following, axisDates, axisFrom, to))
    );

    const [meLifetimeSummary, ...followLifetimeSummaries] = await Promise.all([
      collectLifetimeSummaryForProfile(me, to),
      ...filteredFollows.map((f) => collectLifetimeSummaryForProfile(f.following, to)),
    ]);

    const meOut = { ...meData, summaryWindow: meData.summary, summary: meLifetimeSummary };
    const followsOut = followData.map((entry, idx) => ({
      ...entry,
      summaryWindow: entry.summary,
      summary: followLifetimeSummaries[idx] ?? entry.summary,
    }));

    return Response.json({
      range,
      from: axisFrom.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      availableDays,
      axisDates,
      maxLookbackDays: MAX_LOOKBACK_DAYS,
      isCapped,
      me: meOut,
      follows: followsOut,
    });
  } catch (e: any) {
    return Response.json(
      { error: "COMPARE_READ_FAILED", message: e?.message ?? "Failed to load compare data" },
      { status: 500 }
    );
  }
}
