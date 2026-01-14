// apps/web/src/app/wurple/page.tsx
import { headers } from "next/headers";
import WurpleClient from "./WurpleClient";
import Link from "next/link";

type Props = {
  searchParams?: Promise<{ seed?: string; mode?: string }>;
};

function todayNY(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

export default async function Page({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const seed = sp.seed ?? todayNY();
  const mode = (sp.mode ?? "easy").toLowerCase() === "challenge" ? "challenge" : "easy";

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";


  const url = new URL("/api/wurple/daily", `${proto}://${host}`);
  url.searchParams.set("seed", seed);
  url.searchParams.set("mode", mode);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: h, // 👈 forward cookies/auth headers
  });
if (!res.ok) {
  const text = await res.text();
  return (
    <main style={{ padding: 24 }}>
      <h1>Wurple</h1>
      <p>Couldn't load today's puzzle.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {`Status: ${res.status}\n${text.slice(0, 300)}`}
      </pre>
      <Link href="/wurple/archive" className="underline">
        Play Archived Puzzles
      </Link>
    </main>
  );
}


  const initialDaily = await res.json();
  const d1=new Date(initialDaily.seed).toDateString();
  const d2=new Date(todayNY()).toDateString();
  console.log("d1:", d1, "d2:", d2);
  const isToday = d1 === d2;
  console.log("WurpleClient initialDaily", initialDaily);
  return (
    <main style={{ padding: 24 }}>
    <h1 className="center flex flex-col items-center gap-2 mb-6">
      <span className="font-semibold text-xl">Today’s Puzzle</span>

    </h1>

      <WurpleClient initialDaily={initialDaily} />
          <Link
        href="/wurple/archive"
        className="underline opacity-80 hover:opacity-100 flex justify-center mt-6 block"
      >
        Play Archived Puzzles
      </Link>
    </main>
  );
}
