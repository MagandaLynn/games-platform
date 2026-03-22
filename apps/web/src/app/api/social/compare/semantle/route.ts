import { prisma } from "@playseed/db";
import { getBlockedProfileIds, getBlockingProfileIds, getDateRange, parseRange, resolveOrCreateProfile } from "../../_shared";

export const runtime = "nodejs";

type DailyPoint = {
  date: string;
  importedOn?: string | null;
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
  puzzleNumber: number;
  solved: boolean;
  guessCount: number | null;
  topScore: number | null;
  hintsUsed: number | null;
  importedAt: Date;
  updatedAt: Date;
};

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

function rankPlay(play: RawPlay) {
  const solvedWeight = play.solved ? 1000 : 0;
  const guessWeight = play.guessCount === null ? 0 : Math.max(0, 300 - play.guessCount);
  const scoreWeight = play.topScore ?? 0;
  return solvedWeight + guessWeight + scoreWeight;
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

async function queryPlays(profile: ProfileRef, from: Date, to: Date) {
  const toExclusive = addDaysUTC(to, 1);

  try {
    if (profile.userId) {
      return await prisma.$queryRaw<RawPlay[]>`
        SELECT
          "puzzleNumber",
          "solved",
          "guessCount",
          "topScore",
          "hintsUsed",
          "importedAt",
          "updatedAt"
        FROM "SemantleDailyPlay"
        WHERE "importedAt" >= ${from}
          AND "importedAt" < ${toExclusive}
          AND (
            "sessionId" = ${profile.sessionId}
            OR "userId" = ${profile.userId}
          )
        ORDER BY "importedAt" ASC, "updatedAt" DESC
      `;
    }

    return await prisma.$queryRaw<RawPlay[]>`
      SELECT
        "puzzleNumber",
        "solved",
        "guessCount",
        "topScore",
        "hintsUsed",
        "importedAt",
        "updatedAt"
      FROM "SemantleDailyPlay"
      WHERE "importedAt" >= ${from}
        AND "importedAt" < ${toExclusive}
        AND "sessionId" = ${profile.sessionId}
      ORDER BY "importedAt" ASC, "updatedAt" DESC
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (message.includes("SemantleDailyPlay") && (message.includes("does not exist") || message.includes("42P01"))) {
      return [];
    }
    throw error;
  }
}

async function findEarliestDateForProfile(profile: ProfileRef, to: Date) {
  const toExclusive = addDaysUTC(to, 1);

  try {
    if (profile.userId) {
      const rows = await prisma.$queryRaw<Array<{ importedAt: Date }>>`
        SELECT "importedAt"
        FROM "SemantleDailyPlay"
        WHERE "importedAt" < ${toExclusive}
          AND (
            "sessionId" = ${profile.sessionId}
            OR "userId" = ${profile.userId}
          )
        ORDER BY "importedAt" ASC
        LIMIT 1
      `;

      return rows[0]?.importedAt ?? null;
    }

    const rows = await prisma.$queryRaw<Array<{ importedAt: Date }>>`
      SELECT "importedAt"
      FROM "SemantleDailyPlay"
      WHERE "importedAt" < ${toExclusive}
        AND "sessionId" = ${profile.sessionId}
      ORDER BY "importedAt" ASC
      LIMIT 1
    `;

    return rows[0]?.importedAt ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    if (message.includes("SemantleDailyPlay") && (message.includes("does not exist") || message.includes("42P01"))) {
      return null;
    }
    throw error;
  }
}

async function collectForProfile(profile: ProfileRef, axisDates: string[], from: Date, to: Date) {
  const plays = await queryPlays(profile, from, to);
  const bestPlayByPuzzle = new Map<string, RawPlay>();

  for (const play of plays) {
    const puzzleKey = String(play.puzzleNumber);
    bestPlayByPuzzle.set(puzzleKey, chooseBetterPlay(bestPlayByPuzzle.get(puzzleKey), play));
  }

  const daily: DailyPoint[] = axisDates.map((date) => {
    const play = bestPlayByPuzzle.get(date);
    const attempted = Boolean(play);
    const completed = Boolean(play);
    const won = Boolean(play?.solved);
    const lost = Boolean(play && !play.solved);
    const guessedCount = play?.guessCount ?? 0;
    const hintUsed = (play?.hintsUsed ?? 0) > 0;
    const perfect = Boolean(play?.solved && play?.guessCount === 1);

    return {
      date,
      importedOn: play ? toDateKey(play.importedAt) : null,
      attempted,
      completed,
      won,
      lost,
      wrongGuesses: null,
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
  const totalGuesses = daily.reduce((sum, d) => sum + (d.completed ? d.guessedCount : 0), 0);
  const hintUsedCount = daily.filter((d) => d.completed && d.hintUsed).length;

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
      hintUsageRate: totalCompleted ? Number((hintUsedCount / totalCompleted).toFixed(2)) : 0,
      perfectRate: totalCompleted ? Number((perfectCount / totalCompleted).toFixed(2)) : 0,
    },
    daily,
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
    const blockedIds = new Set<string>([...blockedByMe, ...blockedByOthers]);

    const follows = await prisma.socialFollow.findMany({
      where: { followerProfileId: me.id },
      include: { following: true },
      orderBy: { createdAt: "asc" },
      take: 25,
    });
    const filteredFollows = follows.filter((f) => !blockedIds.has(f.followingProfileId));

    const axisFrom = from ?? (() => {
      const fallback = new Date(to);
      fallback.setUTCDate(fallback.getUTCDate() - 29);
      return fallback;
    })();

    if (!from) {
      const candidates = await Promise.all([
        findEarliestDateForProfile(me, to),
        ...filteredFollows.map((f) => findEarliestDateForProfile(f.following, to)),
      ]);

      const earliest = candidates
        .filter((value): value is Date => value instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      if (earliest) {
        axisFrom.setTime(earliest.getTime());
      }
    }

    const [mePlays, ...followPlaySets] = await Promise.all([
      queryPlays(me, axisFrom, to),
      ...filteredFollows.map((f) => queryPlays(f.following, axisFrom, to)),
    ]);

    const axisDates = Array.from(
      new Set(
        [
          ...mePlays.map((play) => String(play.puzzleNumber)),
          ...followPlaySets.flatMap((plays) => plays.map((play) => String(play.puzzleNumber))),
        ].filter((value) => value.length > 0)
      )
    ).sort((a, b) => Number(a) - Number(b));
    const availableDays = axisDates.length;

    const meData = await collectForProfile(me, axisDates, axisFrom, to);
    const followData = await Promise.all(
      filteredFollows.map((f) => collectForProfile(f.following, axisDates, axisFrom, to))
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
