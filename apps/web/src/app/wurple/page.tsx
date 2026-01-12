// apps/web/src/app/wurple/page.tsx
import { headers } from "next/headers";
import WurpleClient from "./WurpleClient";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function todaySeedNY(date?:Date): string {
  const now = date ?? new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // YYYY-MM-DD
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  // Allow overriding via URL:
  // /wurple?seed=2026-01-06&mode=challenge
  const sp = (await searchParams) ?? {};
  const seed = first(sp.seed) ?? todaySeedNY(new Date("1/2/2024"));
  const mode = (first(sp.mode) ?? "easy").toLowerCase() === "challenge" ? "challenge" : "easy";

  // Next 16: headers() is async
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";

  // Prefer forwarded proto (useful behind proxies), fallback to env
  const forwardedProto = h.get("x-forwarded-proto");
  const proto =
    forwardedProto ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  const url = new URL("/api/wurple/daily", `${proto}://${host}`);
  url.searchParams.set("seed", seed);
  url.searchParams.set("mode", mode);

  // Server-side logs are fine, just keep them compact
  console.log(`[wurple/page] daily -> ${url.toString()}`);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[wurple/page] daily FAILED ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(`API failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const initialDaily = await res.json();

  return (
    <main style={{ padding: 24 }}>
      <h1>Wurple reboot</h1>
      <WurpleClient initialDaily={initialDaily} />
    </main>
  );
}
