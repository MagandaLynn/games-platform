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

export async function resolveOrCreateProfile() {
  const sessionId = await ensureSessionId();
  const { userId } = await auth();

  const bySession = await prisma.socialProfile.findUnique({ where: { sessionId } });
  if (bySession) {
    if (!bySession.userId && userId) {
      return prisma.socialProfile.update({
        where: { id: bySession.id },
        data: { userId },
      });
    }
    return bySession;
  }

  if (userId) {
    const byUser = await prisma.socialProfile.findUnique({ where: { userId } });
    if (byUser) {
      return prisma.socialProfile.update({
        where: { id: byUser.id },
        data: { sessionId },
      });
    }
  }

  return prisma.socialProfile.create({
    data: {
      sessionId,
      userId,
      handle: await generateUniqueHandle(),
      followToken: await generateUniqueToken(),
    },
  });
}

export async function withFollowCounts(profileId: string) {
  const [followers, following] = await Promise.all([
    prisma.socialFollow.count({ where: { followingProfileId: profileId } }),
    prisma.socialFollow.count({ where: { followerProfileId: profileId } }),
  ]);

  return { followers, following };
}

export type RangeKey = "30d" | "90d" | "all";

export function parseRange(input: string | null): RangeKey {
  if (input === "90d" || input === "all") return input;
  return "30d";
}

export function getDateRange(range: RangeKey) {
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
