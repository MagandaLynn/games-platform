import { NextResponse } from "next/server";
import { games } from "@playseed/game-core";
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
