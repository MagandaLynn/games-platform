import { prisma } from "@playseed/db";
import crypto from "node:crypto";
import { resolveOrCreateProfile } from "../../social/_shared";

export const runtime = "nodejs";

type ParsedWordle = {
  puzzleNumber: number;
  solved: boolean;
  attempts: number | null;
  maxGuesses: number;
  gridText: string;
};

let wordleTableEnsured = false;

function parseWordleText(input: string): ParsedWordle | null {
  const text = input.trim();
  if (!text) return null;

  const headerMatch = text.match(/Wordle\s+([\d,]+)\s+([1-6Xx])\/(\d+)/i);
  if (!headerMatch) return null;

  const puzzleNumber = Number.parseInt(headerMatch[1].replace(/,/g, ""), 10);
  if (!Number.isFinite(puzzleNumber)) return null;

  const scoreToken = headerMatch[2].toUpperCase();
  const maxGuesses = Number.parseInt(headerMatch[3], 10);
  if (!Number.isFinite(maxGuesses) || maxGuesses <= 0) return null;

  const solved = scoreToken !== "X";
  const attempts = solved ? Number.parseInt(scoreToken, 10) : null;

  const gridLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /[🟩🟨⬛⬜]/.test(line));

  const gridText = gridLines.join("\n");

  return {
    puzzleNumber,
    solved,
    attempts: Number.isFinite(attempts) ? attempts : null,
    maxGuesses,
    gridText,
  };
}

async function ensureWordleTable() {
  if (wordleTableEnsured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WordleDailyPlay" (
      "id" TEXT NOT NULL,
      "puzzleNumber" INTEGER NOT NULL,
      "solved" BOOLEAN NOT NULL DEFAULT false,
      "attempts" INTEGER,
      "maxGuesses" INTEGER NOT NULL DEFAULT 6,
      "rawText" TEXT NOT NULL,
      "gridText" TEXT,
      "sessionId" TEXT NOT NULL,
      "userId" TEXT,
      "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WordleDailyPlay_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "WordleDailyPlay_puzzle_session_key" UNIQUE ("puzzleNumber", "sessionId")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WordleDailyPlay_sessionId_importedAt_idx" ON "WordleDailyPlay" ("sessionId", "importedAt")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "WordleDailyPlay_userId_importedAt_idx" ON "WordleDailyPlay" ("userId", "importedAt")`
  );

  wordleTableEnsured = true;
}

export async function POST(req: Request) {
  try {
    const actor = await resolveOrCreateProfile();
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text : "";

    const parsed = parseWordleText(text);
    if (!parsed) {
      return Response.json({ error: "INVALID_WORDLE_RESULT" }, { status: 400 });
    }

    await ensureWordleTable();

    await prisma.$executeRaw`
      INSERT INTO "WordleDailyPlay" (
        "id",
        "puzzleNumber",
        "solved",
        "attempts",
        "maxGuesses",
        "rawText",
        "gridText",
        "sessionId",
        "userId",
        "importedAt",
        "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${parsed.puzzleNumber},
        ${parsed.solved},
        ${parsed.attempts},
        ${parsed.maxGuesses},
        ${text.trim()},
        ${parsed.gridText || null},
        ${actor.sessionId},
        ${actor.userId},
        NOW(),
        NOW()
      )
      ON CONFLICT ("puzzleNumber", "sessionId")
      DO UPDATE SET
        "solved" = "WordleDailyPlay"."solved" OR EXCLUDED."solved",
        "attempts" = CASE
          WHEN EXCLUDED."attempts" IS NULL THEN "WordleDailyPlay"."attempts"
          WHEN "WordleDailyPlay"."attempts" IS NULL THEN EXCLUDED."attempts"
          ELSE LEAST("WordleDailyPlay"."attempts", EXCLUDED."attempts")
        END,
        "maxGuesses" = GREATEST("WordleDailyPlay"."maxGuesses", EXCLUDED."maxGuesses"),
        "rawText" = EXCLUDED."rawText",
        "gridText" = EXCLUDED."gridText",
        "updatedAt" = NOW()
    `;

    return Response.json({
      ok: true,
      parsed,
      message: `Imported Wordle #${parsed.puzzleNumber}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import Wordle result";
    return Response.json(
      { error: "WORDLE_IMPORT_FAILED", message },
      { status: 500 }
    );
  }
}
