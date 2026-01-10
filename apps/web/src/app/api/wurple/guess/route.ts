// apps/web/src/app/api/wurple/guess/route.ts
import { NextResponse } from "next/server";
import { games } from "@playseed/game-core";

const RULES_VERSION = 1;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid JSON");

  const seed = typeof body.seed === "string" ? body.seed : "";
  const guess = typeof body.guess === "string" ? body.guess : "";
  const previousGuesses = Array.isArray(body.previousGuesses)
    ? body.previousGuesses.filter((g: unknown) => typeof g === "string")
    : [];

  if (!seed) return badRequest("Missing seed");
  if (!guess) return badRequest("Missing guess");

  // 1) rebuild from seed
  let state = games.wurpleServer.createInitialState(seed);

  // 2) replay previous guesses (stateless server)
  for (const g of previousGuesses) {
    state = games.wurpleServer.applyGuess(state, g);
  }

  // 3) apply new guess
  state = games.wurpleServer.applyGuess(state, guess);

  // 4) internal result (server-only), but return public-safe shape
  const internal = games.wurpleServer.getInternalResult(state);

  return NextResponse.json({
    seed,
    guessCount: state.guesses.length,
    maxGuesses: state.maxGuesses,
    status: internal.status,                 // "playing" | "won" | "lost"
    gameOver: internal.status !== "playing",
    rulesVersion: RULES_VERSION,

    // Optional, but useful for UI:
    normalizedGuess: state.guesses[state.guesses.length - 1],

    // Optional feedback: include ONLY safe metrics
    // feedback: internal.lastFeedback,
  });
}
