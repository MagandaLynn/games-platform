import { prisma } from "@playseed/db";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import crypto from "node:crypto";

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
const SESSION_COOKIE = "sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

async function ensureSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;
  const sid = crypto.randomUUID();
  store.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return sid;
}

export function sanitizeHandle(input: string): string | null {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!HANDLE_RE.test(normalized)) return null;
  return normalized;
}

function randomSuffix(len = 6) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function generateUniqueHandle() {
  for (let i = 0; i < 12; i++) {
    const candidate = `player_${randomSuffix(6)}`;
    const exists = await prisma.socialProfile.findUnique({ where: { handle: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Unable to allocate handle");
}

async function generateUniqueToken() {
  for (let i = 0; i < 12; i++) {
    const token = `flw_${crypto.randomBytes(12).toString("base64url")}`;
    const exists = await prisma.socialProfile.findUnique({ where: { followToken: token } });
    if (!exists) return token;
  }
  throw new Error("Unable to allocate follow token");
}

function isMissingWordleTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("WordleDailyPlay") &&
    (message.includes("does not exist") || message.includes("42P01") || message.includes("P2021"))
  );
}

async function backfillUserOwnership(sessionId: string, userId: string) {
  await Promise.all([
    prisma.hangmanPlay.updateMany({
      where: { sessionId, userId: null },
      data: { userId },
    }),
    prisma.wurpleDailyPlay.updateMany({
      where: { sessionId, userId: null },
      data: { userId },
    }),
    prisma.semantleDailyPlay.updateMany({
      where: { sessionId, userId: null },
      data: { userId },
    }),
    prisma.rPGCharacter.updateMany({
      where: { sessionId, userId: null },
      data: { userId },
    }),
    (async () => {
      try {
        await prisma.$executeRaw`
          UPDATE "WordleDailyPlay"
          SET "userId" = ${userId}, "updatedAt" = NOW()
          WHERE "sessionId" = ${sessionId}
            AND "userId" IS NULL
        `;
      } catch (error) {
        if (isMissingWordleTable(error)) return;
        throw error;
      }
    })(),
  ]);
}

export async function resolveOrCreateProfile() {
  const sessionId = await ensureSessionId();
  const { userId } = await auth();

  const bySession = await prisma.socialProfile.findUnique({ where: { sessionId } });
  if (bySession) {
    if (!bySession.userId && userId) {
      const updated = await prisma.socialProfile.update({
        where: { id: bySession.id },
        data: { userId },
      });

      await backfillUserOwnership(sessionId, userId).catch(() => {
        // Keep profile resolution resilient if backfill partially fails.
      });

      return updated;
    }

    if (userId) {
      await backfillUserOwnership(sessionId, userId).catch(() => {
        // Keep profile resolution resilient if backfill partially fails.
      });
    }

    return bySession;
  }

  if (userId) {
    const byUser = await prisma.socialProfile.findUnique({ where: { userId } });
    if (byUser) {
      const updated = await prisma.socialProfile.update({
        where: { id: byUser.id },
        data: { sessionId },
      });

      await backfillUserOwnership(sessionId, userId).catch(() => {
        // Keep profile resolution resilient if backfill partially fails.
      });

      return updated;
    }
  }

  const created = await prisma.socialProfile.create({
    data: {
      sessionId,
      userId,
      handle: await generateUniqueHandle(),
      followToken: await generateUniqueToken(),
    },
  });

  if (userId) {
    await backfillUserOwnership(sessionId, userId).catch(() => {
      // Keep profile resolution resilient if backfill partially fails.
    });
  }

  return created;
}

export async function withFollowCounts(profileId: string) {
  const [followers, following] = await Promise.all([
    prisma.socialFollow.count({ where: { followingProfileId: profileId } }),
    prisma.socialFollow.count({ where: { followerProfileId: profileId } }),
  ]);

  return { followers, following };
}

type SocialBlockRow = {
  blockerProfileId: string;
  blockedProfileId: string;
};

let socialBlockEnsured = false;

function isMissingSocialBlockTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("SocialBlock") &&
    (message.includes("does not exist") || message.includes("42P01") || message.includes("P2021"))
  );
}

export async function ensureSocialBlockTable() {
  if (socialBlockEnsured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SocialBlock" (
      "id" TEXT NOT NULL,
      "blockerProfileId" TEXT NOT NULL,
      "blockedProfileId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SocialBlock_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "SocialBlock_blockerProfileId_fkey" FOREIGN KEY ("blockerProfileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SocialBlock_blockedProfileId_fkey" FOREIGN KEY ("blockedProfileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SocialBlock_blocker_blocked_key" UNIQUE ("blockerProfileId", "blockedProfileId")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "SocialBlock_blockerProfileId_createdAt_idx" ON "SocialBlock" ("blockerProfileId", "createdAt")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "SocialBlock_blockedProfileId_createdAt_idx" ON "SocialBlock" ("blockedProfileId", "createdAt")`
  );

  socialBlockEnsured = true;
}

export async function getBlockedProfileIds(actorProfileId: string) {
  try {
    const rows = (await prisma.$queryRaw<Array<Pick<SocialBlockRow, "blockedProfileId">>>`
      SELECT "blockedProfileId"
      FROM "SocialBlock"
      WHERE "blockerProfileId" = ${actorProfileId}
    `) as Array<Pick<SocialBlockRow, "blockedProfileId">>;

    return rows.map((row) => row.blockedProfileId);
  } catch (error) {
    if (isMissingSocialBlockTable(error)) return [];
    throw error;
  }
}

export async function getBlockingProfileIds(actorProfileId: string) {
  try {
    const rows = (await prisma.$queryRaw<Array<Pick<SocialBlockRow, "blockerProfileId">>>`
      SELECT "blockerProfileId"
      FROM "SocialBlock"
      WHERE "blockedProfileId" = ${actorProfileId}
    `) as Array<Pick<SocialBlockRow, "blockerProfileId">>;

    return rows.map((row) => row.blockerProfileId);
  } catch (error) {
    if (isMissingSocialBlockTable(error)) return [];
    throw error;
  }
}

export async function isBlockedBetween(aProfileId: string, bProfileId: string) {
  try {
    const rows = (await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "SocialBlock"
      WHERE
        ("blockerProfileId" = ${aProfileId} AND "blockedProfileId" = ${bProfileId})
        OR
        ("blockerProfileId" = ${bProfileId} AND "blockedProfileId" = ${aProfileId})
    `) as Array<{ count: number }>;

    return (rows[0]?.count ?? 0) > 0;
  } catch (error) {
    if (isMissingSocialBlockTable(error)) return false;
    throw error;
  }
}

export type RangeKey = "30d" | "90d" | "all";

export function parseRange(input: string | null): RangeKey {
  if (input === "90d" || input === "all") return input;
  return "30d";
}

function parseDateParam(input: string | null): Date | null {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;

  const [year, month, day] = input.split("-").map((v) => Number.parseInt(v, 10));
  if (!year || !month || !day) return null;

  const value = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

export function getDateRange(range: RangeKey, customFromInput?: string | null, customToInput?: string | null) {
  const customFrom = parseDateParam(customFromInput ?? null);
  const customTo = parseDateParam(customToInput ?? null);

  if (customFrom && customTo && customFrom <= customTo) {
    return { from: customFrom, to: customTo };
  }

  const to = new Date();
  const toUtc = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

  if (range === "all") {
    return { from: null as Date | null, to: toUtc };
  }

  const days = range === "90d" ? 90 : 30;
  const from = new Date(toUtc);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from, to: toUtc };
}
