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

    await prisma.$executeRaw`
      INSERT INTO "SemantleDailyPlay" (
        "id",
        "puzzleNumber",
        "solved",
        "guessCount",
        "topGuessNumber",
        "topScore",
        "hintsUsed",
        "rawText",
        "sessionId",
        "userId",
        "importedAt",
        "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${parsed.puzzleNumber},
        ${parsed.solved},
        ${parsed.guessCount},
        ${parsed.topGuessNumber},
        ${parsed.topScore},
        ${parsed.hintsUsed},
        ${text.trim()},
        ${actor.sessionId},
        ${actor.userId},
        NOW(),
        NOW()
      )
      ON CONFLICT ("puzzleNumber", "sessionId")
      DO UPDATE SET
        "solved" = "SemantleDailyPlay"."solved" OR EXCLUDED."solved",
        "guessCount" = CASE
          WHEN EXCLUDED."guessCount" IS NULL THEN "SemantleDailyPlay"."guessCount"
          WHEN "SemantleDailyPlay"."guessCount" IS NULL THEN EXCLUDED."guessCount"
          ELSE LEAST("SemantleDailyPlay"."guessCount", EXCLUDED."guessCount")
        END,
        "topGuessNumber" = CASE
          WHEN EXCLUDED."topGuessNumber" IS NULL THEN "SemantleDailyPlay"."topGuessNumber"
          WHEN "SemantleDailyPlay"."topGuessNumber" IS NULL THEN EXCLUDED."topGuessNumber"
          ELSE LEAST("SemantleDailyPlay"."topGuessNumber", EXCLUDED."topGuessNumber")
        END,
        "topScore" = CASE
          WHEN EXCLUDED."topScore" IS NULL THEN "SemantleDailyPlay"."topScore"
          WHEN "SemantleDailyPlay"."topScore" IS NULL THEN EXCLUDED."topScore"
          ELSE GREATEST("SemantleDailyPlay"."topScore", EXCLUDED."topScore")
        END,
        "hintsUsed" = CASE
          WHEN EXCLUDED."hintsUsed" IS NULL THEN "SemantleDailyPlay"."hintsUsed"
          WHEN "SemantleDailyPlay"."hintsUsed" IS NULL THEN EXCLUDED."hintsUsed"
          ELSE LEAST("SemantleDailyPlay"."hintsUsed", EXCLUDED."hintsUsed")
        END,
        "rawText" = EXCLUDED."rawText",
        "updatedAt" = NOW()
    `;

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
