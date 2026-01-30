import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { games } from "@playseed/game-core";

export const runtime = "nodejs";

function canonicalizeGuessed(s: string) {
  return Array.from(new Set((s ?? "").split("").filter(Boolean))).sort().join("");
}

// Uses the server-only phrase to classify guessed letters without revealing it.
function computeLetterBuckets(phrase: string, guessed: string[]) {
  const P = (phrase ?? "").toUpperCase();
  const correctLetters: string[] = [];
  const wrongLetters: string[] = [];

  for (const ch of guessed) {
    if (!ch) continue;
    if (P.includes(ch)) correctLetters.push(ch);
    else wrongLetters.push(ch);
  }

  return { correctLetters, wrongLetters };
}

function toPublic(result: any, phrase: string) {
  const guessed = Array.isArray(result.guessed) ? (result.guessed as string[]) : [];
  const { correctLetters, wrongLetters } = computeLetterBuckets(phrase, guessed);

  const status = result.status as "playing" | "won" | "lost";
  const isOver = status !== "playing";

  return {
    masked: result.masked,
    guessed,
    remaining: result.remaining,
    wrongGuesses: result.wrongGuesses,
    maxWrong: result.maxWrong,
    status,
    isComplete: result.isComplete,
    correctLetters,
    wrongLetters,

    // ✅ only reveal solution after completion (win OR loss)
    solution: isOver ? phrase : null,
  };
}

export async function POST(req: Request) {
  try {
    const sessionId = await requireSessionId();
    const body = await req.json().catch(() => ({}));
    const instanceId: string | undefined = body.instanceId;

    if (!instanceId) {
      return Response.json({ error: "instanceId is required" }, { status: 400 });
    }

    const instance = await prisma.hangmanDailyInstance.findUnique({
      where: { id: instanceId },
      include: { puzzle: true },
    });
    if (!instance) return Response.json({ error: "Instance not found" }, { status: 404 });

    // Ensure a play row exists so state always has something backing it
    const play = await prisma.hangmanPlay.upsert({
      where: { instance_session: { instanceId, sessionId } },
      update: {},
      create: { instanceId, sessionId },
      select: {
        id: true,
        instanceId: true,
        sessionId: true,
        userId: true,
        status: true,
        wrongGuesses: true,
        guessed: true,
        createdAt: true,
        updatedAt: true,

        // ✅ persisted attempt-level fields
        hintUsed: true,
        hintUsedAt: true,
      },
    });

    const guessedStr = canonicalizeGuessed(play.guessed ?? "");

    // Recompute state from scratch
    let state = games.hangman.createInitialState(instance.puzzle.phrase, { maxWrong: 6 });
    for (const ch of guessedStr.split("")) {
      state = games.hangman.applyGuess(state, ch);
    }
    const result = games.hangman.getResult(state);

    // Optional: keep DB in sync with engine-derived truth
    if (
      play.status !== result.status ||
      play.wrongGuesses !== result.wrongGuesses ||
      (play.guessed ?? "") !== guessedStr
    ) {
      await prisma.hangmanPlay.update({
        where: { id: play.id },
        data: {
          guessed: guessedStr,
          wrongGuesses: result.wrongGuesses,
          status: result.status,
        },
      });
    }

    return Response.json({
      instanceId,
      mode: instance.mode,
      date: instance.date.toISOString(),
      hint: instance.puzzle.hint ?? null,
      category: instance.puzzle.category ?? null,

      play: {
        ...toPublic(result, instance.puzzle.phrase),

        // ✅ persisted attempt-level fields
        hintUsed: play.hintUsed ?? false,
        hintUsedAt: play.hintUsedAt ? play.hintUsedAt.toISOString() : null,

        // ✅ include mode for share correctness
        mode: instance.mode,
      },
    });
  } catch (e: any) {
    console.error("[hangman/state][POST]", e);
    return Response.json(
      {
        error: "state failed",
        message: e?.message ?? String(e),
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
