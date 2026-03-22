import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { games } from "@playseed/game-core";
import { canonicalizeGuessed, toPublicPlay } from "../_shared";

export const runtime = "nodejs";

function normalizeLetter(input: string): string | null {
  const s = String(input ?? "").trim().toUpperCase();
  if (s.length !== 1) return null;
  const code = s.charCodeAt(0);
  if (code < 65 || code > 90) return null;
  return s;
}

export async function POST(req: Request) {
  const sessionId = await requireSessionId();
  const body = await req.json().catch(() => ({}));

  const instanceId: string | undefined = body.instanceId;
  const rawGuess: string | undefined = body.letter ?? body.guess;

  if (!instanceId || !rawGuess) {
    return Response.json({ error: "instanceId and letter are required" }, { status: 400 });
  }

  const letter = normalizeLetter(rawGuess);
  if (!letter) {
    return Response.json({ error: "Invalid letter (A–Z)" }, { status: 400 });
  }

  const instance = await prisma.hangmanDailyInstance.findUnique({
    where: { id: instanceId },
    include: { puzzle: true },
  });
  if (!instance) return Response.json({ error: "Instance not found" }, { status: 404 });

  const play = await prisma.hangmanPlay.upsert({
    where: { instance_session: { instanceId, sessionId } },
    update: {},
    create: { instanceId, sessionId },
  });

  const guessedBefore = canonicalizeGuessed(play.guessed ?? "");
  const alreadyGuessed = guessedBefore.includes(letter);

  // Recompute current state from guessedBefore (source of truth)
  let state = games.hangman.createInitialState(instance.puzzle.phrase, { maxWrong: 6 });
  for (const ch of guessedBefore.split("")) {
    state = games.hangman.applyGuess(state, ch);
  }

  const current = games.hangman.getResult(state);

  // ✅ Server-side guard: game is over OR duplicate guess => no changes, just return current
  if (current.status !== "playing" || alreadyGuessed) {
    // Ensure DB status stays in sync if something ended on a previous request
    if (play.status !== current.status || play.wrongGuesses !== current.wrongGuesses) {
      await prisma.hangmanPlay.update({
        where: { id: play.id },
        data: {
          status: current.status,
          wrongGuesses: current.wrongGuesses,
          guessed: guessedBefore,
        },
      });
    }

    return Response.json({
      instanceId,
      play: toPublicPlay(current, instance.puzzle.phrase, instance.mode),
    });
  }

  // Apply the new guess
  state = games.hangman.applyGuess(state, letter);
  const result = games.hangman.getResult(state);

  const guessedAfter = canonicalizeGuessed((result.guessed ?? []).join(""));

  await prisma.hangmanPlay.update({
    where: { id: play.id },
    data: {
      guessed: guessedAfter,
      wrongGuesses: result.wrongGuesses,
      status: result.status,
    },
  });

  return Response.json({
    instanceId,
    play: toPublicPlay(result, instance.puzzle.phrase, instance.mode),
  });
}
