import { prisma } from "@playseed/db";
import crypto from "node:crypto";
import { resolveOrCreateProfile } from "../../social/_shared";

export const runtime = "nodejs";

type ParsedSemantle = {
  puzzleNumber: number;
  solved: boolean;
  guessCount: number | null;
  topGuessNumber: number | null;
  topScore: number | null;
  hintsUsed: number | null;
};

let semantleTableEnsured = false;

function parseSemantleText(input: string): ParsedSemantle | null {
  const text = input.trim();
  if (!text) return null;

  const puzzleMatch = text.match(/Semantle\s*#(\d+)/i);
  if (!puzzleMatch) return null;

  const guessesMatch = text.match(/(?:✅|❌)?\s*(\d+)\s+Guesses?/i);
  const topGuessMatch = text.match(/Guess\s*#(\d+)/i);
  const topScoreMatch = text.match(/(?:🥈|🥉|🥇)?\s*(\d+)\s*\/\s*1000/i);
  const hintsMatch = text.match(/💡?\s*(\d+)\s+Hints?/i);

  return {
    puzzleNumber: Number.parseInt(puzzleMatch[1], 10),
    solved: /✅/.test(text),
    guessCount: guessesMatch ? Number.parseInt(guessesMatch[1], 10) : null,
    topGuessNumber: topGuessMatch ? Number.parseInt(topGuessMatch[1], 10) : null,
    topScore: topScoreMatch ? Number.parseInt(topScoreMatch[1], 10) : null,
    hintsUsed: hintsMatch ? Number.parseInt(hintsMatch[1], 10) : null,
  };
}

async function ensureSemantleTable() {
  if (semantleTableEnsured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SemantleDailyPlay" (
      "id" TEXT NOT NULL,
      "puzzleNumber" INTEGER NOT NULL,
      "solved" BOOLEAN NOT NULL DEFAULT false,
      "guessCount" INTEGER,
      "topGuessNumber" INTEGER,
      "topScore" INTEGER,
      "hintsUsed" INTEGER,
      "rawText" TEXT NOT NULL,
      "sessionId" TEXT NOT NULL,
      "userId" TEXT,
      "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SemantleDailyPlay_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "SemantleDailyPlay_puzzle_session_key" UNIQUE ("puzzleNumber", "sessionId")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "SemantleDailyPlay_sessionId_importedAt_idx" ON "SemantleDailyPlay" ("sessionId", "importedAt")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "SemantleDailyPlay_userId_importedAt_idx" ON "SemantleDailyPlay" ("userId", "importedAt")`
  );

  semantleTableEnsured = true;
}

export async function POST(req: Request) {
  try {
    const actor = await resolveOrCreateProfile();
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text : "";

    const parsed = parseSemantleText(text);
    if (!parsed) {
      return Response.json({ error: "INVALID_SEMANTLE_RESULT" }, { status: 400 });
    }

    await ensureSemantleTable();

    // Check if userId-based play already exists
    if (actor.userId) {
      const existing = await prisma.semantleDailyPlay.findFirst({
        where: {
          puzzleNumber: parsed.puzzleNumber,
          userId: actor.userId,
        },
      });
      if (existing) {
        return Response.json({
          ok: false,
          parsed,
          message: `You've already imported Semantle #${parsed.puzzleNumber}`,
        });
      }
    }

    // Check if sessionId-based play exists and link it if upgrading to userId
    const existingSession = await prisma.semantleDailyPlay.findFirst({
      where: {
        puzzleNumber: parsed.puzzleNumber,
        sessionId: actor.sessionId,
      },
    });

    if (existingSession) {
      if (actor.userId && !existingSession.userId) {
        await prisma.semantleDailyPlay.update({
          where: { id: existingSession.id },
          data: { userId: actor.userId },
        });
      }
      return Response.json({
        ok: false,
        parsed,
        message: `You've already imported Semantle #${parsed.puzzleNumber}`,
      });
    }

    // Create new play
    await prisma.semantleDailyPlay.create({
      data: {
        puzzleNumber: parsed.puzzleNumber,
        solved: parsed.solved,
        guessCount: parsed.guessCount,
        topGuessNumber: parsed.topGuessNumber,
        topScore: parsed.topScore,
        hintsUsed: parsed.hintsUsed,
        rawText: text.trim(),
        sessionId: actor.sessionId,
        userId: actor.userId,
      },
    });

    return Response.json({
      ok: true,
      parsed,
      message: `Imported Semantle #${parsed.puzzleNumber}`,
    });
  } catch (e: any) {
    return Response.json(
      { error: "SEMANTLE_IMPORT_FAILED", message: e?.message ?? "Failed to import Semantle result" },
      { status: 500 }
    );
  }
}
