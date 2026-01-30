import { NextResponse } from "next/server";
import { games } from "@playseed/game-core";
import { DailyResponse } from "@/app/wurple/helpers/types";
export const runtime = "nodejs";


const RULES_VERSION = 1;

function seedFromRequest(url: URL) {
  const seed = url.searchParams.get("seed");
  if (seed) return seed;

  // Default seed = today in America/New_York as YYYY-MM-DD
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

function modeFromRequest(url: URL): "easy" | "challenge" {
  const m = (url.searchParams.get("mode") ?? "easy").toLowerCase();
  return m === "challenge" ? "challenge" : "easy";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seed = seedFromRequest(url);
  const mode = modeFromRequest(url);

  const cfg =
    mode === "challenge"
      ? games.wurple.MODE_CONFIG.challenge
      : games.wurple.MODE_CONFIG.easy;

  // Build initial state for THIS mode
  const state = games.wurple.createInitialState(seed, cfg);

  const resp: DailyResponse = {
    seed,
    mode,
    maxGuesses: state.maxGuesses,         // number | null baked into state
    allowDuplicates: cfg.allowDuplicates,
    includeTiles: cfg.includeTiles,
    includeDistance: cfg.includeDistance,
    rulesVersion: RULES_VERSION,
  };

  return NextResponse.json(resp, { status: 200 });
}
