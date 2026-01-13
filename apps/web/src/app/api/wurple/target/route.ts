import { games } from "@playseed/game-core";

function seedFromRequest(url: URL) {
  const seed = url.searchParams.get("seed");
  if (seed) return seed;

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

  const state = games.wurple.createInitialState(seed, cfg);
  const hex = state.solution; // server-only; not returned as JSON

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
  <rect x="0" y="0" width="200" height="100" fill="#${hex}" />
</svg>`;

return new Response(svg, {
  status: 200,
  headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "no-store",
  },
});
  
}
