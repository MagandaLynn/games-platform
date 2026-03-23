import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

type WurpleMode = "easy" | "challenge";
type WurpleStatus = "playing" | "won" | "lost";

type ImportEntry = {
  seed: string;
  mode: WurpleMode;
  status: WurpleStatus;
  guessCount: number;
  guesses: string[];
  completedAt?: string | null;
};

function seedToUtcDate(seed: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(seed)) return null;
  const date = new Date(`${seed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isMode(value: unknown): value is WurpleMode {
  return value === "easy" || value === "challenge";
}

function isStatus(value: unknown): value is WurpleStatus {
  return value === "playing" || value === "won" || value === "lost";
}

function toImportEntry(value: unknown): ImportEntry | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const seed = typeof row.seed === "string" ? row.seed : "";
  const mode = row.mode;
  const status = row.status;
  const guessCountRaw = row.guessCount;
  const completedAtRaw = row.completedAt;
  const guessesRaw = row.guesses;

  if (!seed || !isMode(mode) || !isStatus(status)) return null;
  const date = seedToUtcDate(seed);
  if (!date) return null;

  const guessCount =
    typeof guessCountRaw === "number" && Number.isFinite(guessCountRaw)
      ? Math.max(0, Math.floor(guessCountRaw))
      : 0;

  const guesses = Array.isArray(guessesRaw)
    ? guessesRaw.filter((value): value is string => typeof value === "string")
    : [];

  return {
    seed,
    mode,
    status,
    guessCount,
    guesses,
    completedAt: typeof completedAtRaw === "string" ? completedAtRaw : null,
  };
}

function rankEntry(entry: ImportEntry) {
  const statusWeight = entry.status === "won" ? 300 : entry.status === "lost" ? 200 : 100;
  return statusWeight + Math.min(Math.max(entry.guessCount, entry.guesses.length), 99);
}

function chooseBest(current: ImportEntry | undefined, next: ImportEntry) {
  if (!current) return next;
  const currentRank = rankEntry(current);
  const nextRank = rankEntry(next);
  if (nextRank !== currentRank) return nextRank > currentRank ? next : current;

  const currentCompletedAt = current.completedAt ? Date.parse(current.completedAt) : 0;
  const nextCompletedAt = next.completedAt ? Date.parse(next.completedAt) : 0;
  return nextCompletedAt >= currentCompletedAt ? next : current;
}

function hasGuesses(value: string | null | undefined) {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.some((item) => typeof item === "string" && item.length > 0);
  } catch {
    return false;
  }
}

function guessArrayLength(value: string | null | undefined) {
  if (!value) return 0;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").length : 0;
  } catch {
    return 0;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEntries = Array.isArray(body?.entries) ? (body.entries as unknown[]) : [];

    if (rawEntries.length === 0) {
      return Response.json({ ok: true, imported: 0, skipped: 0 });
    }

    const deduped = new Map<string, ImportEntry>();

    for (const raw of rawEntries.slice(0, 5000)) {
      const entry = toImportEntry(raw);
      if (!entry) continue;
      const key = `${entry.seed}:${entry.mode}`;
      deduped.set(key, chooseBest(deduped.get(key), entry));
    }

    const rows = Array.from(deduped.values());
    if (rows.length === 0) {
      return Response.json({ ok: true, imported: 0, skipped: rawEntries.length });
    }

    const sessionId = await requireSessionId();
    const { userId } = await auth();

    let imported = 0;

    for (const entry of rows) {
      const date = seedToUtcDate(entry.seed)!;
      const completedAt = entry.status === "playing"
        ? null
        : entry.completedAt
          ? new Date(entry.completedAt)
          : new Date();

      const guessesJson = JSON.stringify(entry.guesses);
      const shouldBackfillGuesses = entry.guesses.length > 0;

      if (userId) {
        const existingByUser = await prisma.wurpleDailyPlay.findFirst({
          where: { seed: entry.seed, mode: entry.mode, userId },
          select: { id: true, status: true, guessCount: true, guessesJson: true },
        } as any);

        if (existingByUser) {
          const updateData: Record<string, unknown> = {};
          const existingStatus = (existingByUser as any).status as string;
          const existingGuessCount = typeof (existingByUser as any).guessCount === "number" ? (existingByUser as any).guessCount : 0;
          const existingGuessArrayLen = guessArrayLength((existingByUser as any).guessesJson);

          if (existingStatus === "playing") {
            if (entry.status !== "playing") {
              updateData.status = entry.status;
              updateData.won = entry.status === "won";
              updateData.completedAt = completedAt;
            }

            if (entry.guessCount > existingGuessCount) {
              updateData.guessCount = entry.guessCount;
            }
          }

          if (shouldBackfillGuesses && (entry.guesses.length > existingGuessArrayLen || !hasGuesses((existingByUser as any).guessesJson))) {
            updateData.guessesJson = guessesJson;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.wurpleDailyPlay.update({
              where: { id: existingByUser.id },
              data: updateData,
            } as any);
          }
          imported += 1;
          continue;
        }
      }

      const existingBySession = await prisma.wurpleDailyPlay.findFirst({
        where: { seed: entry.seed, mode: entry.mode, sessionId },
        select: { id: true, userId: true, status: true, guessCount: true, guessesJson: true },
      } as any);

      if (existingBySession) {
        const updateData: Record<string, unknown> = {};
        const existingStatus = (existingBySession as any).status as string;
        const existingGuessCount = typeof (existingBySession as any).guessCount === "number" ? (existingBySession as any).guessCount : 0;
        const existingGuessArrayLen = guessArrayLength((existingBySession as any).guessesJson);

        if (userId && !existingBySession.userId) {
          updateData.userId = userId;
        }

        if (existingStatus === "playing") {
          if (entry.status !== "playing") {
            updateData.status = entry.status;
            updateData.won = entry.status === "won";
            updateData.completedAt = completedAt;
          }

          if (entry.guessCount > existingGuessCount) {
            updateData.guessCount = entry.guessCount;
          }
        }

        if (shouldBackfillGuesses && (entry.guesses.length > existingGuessArrayLen || !hasGuesses((existingBySession as any).guessesJson))) {
          updateData.guessesJson = guessesJson;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.wurpleDailyPlay.update({
            where: { id: existingBySession.id },
            data: updateData,
          } as any);
        }

        imported += 1;
        continue;
      }

      await prisma.wurpleDailyPlay.create({
        data: {
          seed: entry.seed,
          date,
          mode: entry.mode,
          sessionId,
          userId,
          status: entry.status,
          guessCount: entry.guessCount,
          guessesJson,
          won: entry.status === "won",
          completedAt,
        },
      } as any);

      imported += 1;
    }

    return Response.json({ ok: true, imported, skipped: rawEntries.length - rows.length });
  } catch (e: any) {
    return Response.json(
      { error: "IMPORT_FAILED", message: e?.message ?? "Failed to import local Wurple history" },
      { status: 500 }
    );
  }
}
