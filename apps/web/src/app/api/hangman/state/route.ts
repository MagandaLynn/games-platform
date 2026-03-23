import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { games } from "@playseed/game-core";
import { auth } from "@clerk/nextjs/server";
import { canonicalizeGuessed, toPublicPlay } from "../_shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sessionId = await requireSessionId();
    const { userId } = await auth();
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

    // Try to find existing play by userId first, then sessionId
    let play = null;

    if (userId) {
      play = await prisma.hangmanPlay.findFirst({
        where: { instanceId, userId },
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
          hintUsed: true,
          hintUsedAt: true,
        },
      });
    }

    if (!play) {
      const sessionPlay = await prisma.hangmanPlay.findFirst({
        where: { instanceId, sessionId },
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
          hintUsed: true,
          hintUsedAt: true,
        },
      });

      if (sessionPlay) {
        if (userId && !sessionPlay.userId) {
          await prisma.hangmanPlay.update({
            where: { id: sessionPlay.id },
            data: { userId },
          });
        }
        play = sessionPlay;
      }
    }

    if (!play) {
      play = await prisma.hangmanPlay.create({
        data: { instanceId, sessionId, userId },
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
          hintUsed: true,
          hintUsedAt: true,
        },
      });
    }

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
        ...toPublicPlay(result, instance.puzzle.phrase),

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
