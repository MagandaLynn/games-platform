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

  if (!seed || !isMode(mode) || !isStatus(status)) return null;
  const date = seedToUtcDate(seed);
  if (!date) return null;

  const guessCount =
    typeof guessCountRaw === "number" && Number.isFinite(guessCountRaw)
      ? Math.max(0, Math.floor(guessCountRaw))
      : 0;

  return {
    seed,
    mode,
    status,
    guessCount,
    completedAt: typeof completedAtRaw === "string" ? completedAtRaw : null,
  };
}

function rankEntry(entry: ImportEntry) {
  const statusWeight = entry.status === "won" ? 300 : entry.status === "lost" ? 200 : 100;
  return statusWeight + Math.min(entry.guessCount, 99);
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

    await prisma.$transaction(
      rows.map((entry) => {
        const date = seedToUtcDate(entry.seed)!;
        const completedAt = entry.status === "playing"
          ? null
          : entry.completedAt
            ? new Date(entry.completedAt)
            : new Date();

        return prisma.wurpleDailyPlay.upsert({
          where: {
            seed_mode_session: {
              seed: entry.seed,
              mode: entry.mode,
              sessionId,
            },
          },
          update: {
            userId,
            status: entry.status,
            guessCount: entry.guessCount,
            won: entry.status === "won",
            completedAt,
          },
          create: {
            seed: entry.seed,
            date,
            mode: entry.mode,
            sessionId,
            userId,
            status: entry.status,
            guessCount: entry.guessCount,
            won: entry.status === "won",
            completedAt,
          },
        });
      })
    );

    return Response.json({ ok: true, imported: rows.length, skipped: rawEntries.length - rows.length });
  } catch (e: any) {
    return Response.json(
      { error: "IMPORT_FAILED", message: e?.message ?? "Failed to import local Wurple history" },
      { status: 500 }
    );
  }
}
