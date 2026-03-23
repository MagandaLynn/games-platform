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
      CONSTRAINT "WordleDailyPlay_puzzle_user_key" UNIQUE ("puzzleNumber", "userId"),
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

    // Check if userId-based play already exists
    if (actor.userId) {
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "WordleDailyPlay"
        WHERE "puzzleNumber" = ${parsed.puzzleNumber}
          AND "userId" = ${actor.userId}
        LIMIT 1
      `;
      if (existing.length > 0) {
        return Response.json({
          ok: false,
          parsed,
          message: `You've already imported Wordle #${parsed.puzzleNumber}`,
        });
      }
    }

    // Check if sessionId-based play exists and link it if upgrading to userId
    const existingSession = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "WordleDailyPlay"
      WHERE "puzzleNumber" = ${parsed.puzzleNumber}
        AND "sessionId" = ${actor.sessionId}
      LIMIT 1
    `;

    if (existingSession.length > 0) {
      if (actor.userId) {
        await prisma.$executeRaw`
          UPDATE "WordleDailyPlay"
          SET "userId" = ${actor.userId}
          WHERE "puzzleNumber" = ${parsed.puzzleNumber}
            AND "sessionId" = ${actor.sessionId}
            AND "userId" IS NULL
        `;
      }
      return Response.json({
        ok: false,
        parsed,
        message: `You've already imported Wordle #${parsed.puzzleNumber}`,
      });
    }

    // Create new play
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
