import { NextResponse } from "next/server";
import { games } from "@playseed/game-core";
import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { auth } from "@clerk/nextjs/server";
export const runtime = "nodejs";

const RULES_VERSION = 1;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function parseMode(value: unknown): "easy" | "challenge" {
  if (typeof value !== "string") return "easy";
  const m = value.toLowerCase();
  return m === "challenge" ? "challenge" : "easy";
}

function seedToUtcDate(seed: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(seed)) return null;
  const date = new Date(`${seed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
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

async function savePlaySnapshot(args: {
  seed: string;
  mode: "easy" | "challenge";
  guessCount: number;
  guesses: string[];
  maxGuesses: number | null;
  status: "playing" | "won" | "lost";
}) {
  const date = seedToUtcDate(args.seed);
  if (!date) return;

  const sessionId = await requireSessionId();
  const { userId } = await auth();
  const completedAt = args.status === "playing" ? null : new Date();
  const guessesJson = JSON.stringify(args.guesses);

  // For logged-in users, check if a userId-based play already exists
  if (userId) {
    const existing = await prisma.wurpleDailyPlay.findFirst({
      where: { seed: args.seed, mode: args.mode, userId },
      select: { id: true, status: true, guessCount: true, guessesJson: true },
    } as any);
    if (existing) {
      const existingStatus = (existing as any).status as string;
      const existingGuessCount = typeof (existing as any).guessCount === "number" ? (existing as any).guessCount : 0;
      const existingGuessArrayLen = guessArrayLength((existing as any).guessesJson);
      const updateData: Record<string, unknown> = {};

      if (existingStatus === "playing") {
        if (args.status !== "playing") {
          updateData.status = args.status;
          updateData.won = args.status === "won";
          updateData.completedAt = completedAt;
        }
        if (args.guessCount > existingGuessCount) {
          updateData.guessCount = args.guessCount;
          updateData.maxGuesses = args.maxGuesses;
        }
      }

      if (args.guesses.length > existingGuessArrayLen || (args.guesses.length > 0 && !hasGuesses((existing as any).guessesJson))) {
        updateData.guessesJson = guessesJson;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.wurpleDailyPlay.update({
          where: { id: existing.id },
          data: updateData,
        } as any);
      }
      return;
    }
  }

  // Check if a sessionId-based play already exists
  const existingSession = await prisma.wurpleDailyPlay.findFirst({
    where: {
      seed: args.seed,
      mode: args.mode,
      sessionId,
    },
    select: { id: true, userId: true, status: true, guessCount: true, guessesJson: true },
  } as any);

  if (existingSession) {
    // If this is a new userId login (upgrading session → user), update the session play to link userId
    const updateData: Record<string, unknown> = {};
    const existingStatus = (existingSession as any).status as string;
    const existingGuessCount = typeof (existingSession as any).guessCount === "number" ? (existingSession as any).guessCount : 0;
    const existingGuessArrayLen = guessArrayLength((existingSession as any).guessesJson);

    if (userId && !existingSession.userId) {
      updateData.userId = userId;
    }

    if (existingStatus === "playing") {
      if (args.status !== "playing") {
        updateData.status = args.status;
        updateData.won = args.status === "won";
        updateData.completedAt = completedAt;
      }
      if (args.guessCount > existingGuessCount) {
        updateData.guessCount = args.guessCount;
        updateData.maxGuesses = args.maxGuesses;
      }
    }

    if (args.guesses.length > existingGuessArrayLen || (args.guesses.length > 0 && !hasGuesses((existingSession as any).guessesJson))) {
      updateData.guessesJson = guessesJson;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.wurpleDailyPlay.update({
        where: { id: existingSession.id },
        data: updateData,
      } as any);
    }
    return; // Never overwrite existing play
  }

  // Only create if neither userId nor sessionId play exists
  await prisma.wurpleDailyPlay.create({
    data: {
      seed: args.seed,
      date,
      mode: args.mode,
      sessionId,
      userId,
      status: args.status,
      guessCount: args.guessCount,
      guessesJson,
      maxGuesses: args.maxGuesses,
      won: args.status === "won",
      completedAt,
    } as any,
  });
}

function isMissingWurpleStatsTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("WurpleDailyPlay") &&
    (message.includes("does not exist") || message.includes("P2021"))
  );
}

export function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON");

  const seed = typeof body.seed === "string" ? body.seed : "";
  const guess = typeof body.guess === "string" ? body.guess : "";
  const mode = parseMode(body.mode);

  const previousGuesses = Array.isArray(body.previousGuesses)
    ? body.previousGuesses.filter((g: unknown) => typeof g === "string")
    : [];

  if (!seed) return badRequest("Missing seed");
  if (!guess) return badRequest("Missing guess");

  // Get mode config (adjust this line to match your export shape)
  const cfg =
    mode === "challenge"
      ? games.wurple.MODE_CONFIG.challenge
      : games.wurple.MODE_CONFIG.easy;

  // Build initial state for this mode
  let state = games.wurple.createInitialState(seed, cfg);

  // Tamper guard: only enforce if maxGuesses is a number
  if (typeof state.maxGuesses === "number" && previousGuesses.length > state.maxGuesses) {
    return badRequest("Too many previous guesses.");
  }

  try {
    // Replay previous guesses (stateless server)
    for (const g of previousGuesses) {
      state = games.wurple.applyGuess(state, g, cfg);
    }

    // Apply new guess
    state = games.wurple.applyGuess(state, guess, cfg);

    const internal = games.wurple.getInternalResult(state, cfg);
    const normalizedGuess = state.guesses[state.guesses.length - 1] ?? "";

    // Mode-aware feedback (tiles for easy, distance for challenge, etc.)
    const feedback = games.wurple.getGuessFeedback(state.solution, normalizedGuess, cfg);

    try {
      await savePlaySnapshot({
        seed,
        mode,
        guessCount: state.guesses.length,
        guesses: state.guesses,
        maxGuesses: cfg.maxGuesses,
        status: internal.status,
      });
    } catch (saveError) {
      if (!isMissingWurpleStatsTable(saveError)) {
        throw saveError;
      }

      // keep gameplay working even if stats table is not available in this DB
      console.warn("[wurple] stats persistence skipped: WurpleDailyPlay table missing");
    }

    return NextResponse.json({
      seed,
      mode,
      guessCount: state.guesses.length,
      maxGuesses: cfg.maxGuesses,
      status: internal.status,      // "playing" | "won" | "lost"
      gameOver: internal.status !== "playing",
      rulesVersion: RULES_VERSION,
      normalizedGuess,
      feedback,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid guess";
    return badRequest(message);
  }
}
