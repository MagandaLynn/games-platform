import { NextResponse } from "next/server";
import { createInitialState, toPublicDaily } from "@btd/game-core";

function normalizeSeedFromUrl(url: string): string {
  const { searchParams } = new URL(url);
  const seed = searchParams.get("seed");
  // Default to today's UTC date if not provided (stable across users)
  if (!seed) {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return seed.trim();
}

export async function GET(req: Request) {
  const seed = normalizeSeedFromUrl(req.url);

  // For now: no persistence -> initial state (0 guesses)
  const state = createInitialState(seed);

  // Return public metadata only (no solution)
  return NextResponse.json(toPublicDaily(seed, state));
}
