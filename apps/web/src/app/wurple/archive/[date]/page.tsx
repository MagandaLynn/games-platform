// apps/web/src/app/wurple/archive/[date]/page.tsx
import { headers } from "next/headers";
import WurpleClient from "../../WurpleClient";
import Link from "next/link";

type Props = {
  params: Promise<{ date: string }>;
  searchParams?: Promise<{ mode?: string }>;
};

export default async function ArchivePage({ params, searchParams }: Props) {
  const { date } = await params;
  const sp = (await searchParams) ?? {};
  const mode = (sp.mode ?? "easy") === "challenge" ? "challenge" : "easy";

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";

  const url = new URL("/api/wurple/daily", `${proto}://${host}`);
  url.searchParams.set("seed", date);
  url.searchParams.set("mode", mode);

const res = await fetch(url.toString(), {
  cache: "no-store",
  headers: Object.fromEntries(h.entries()),
});
  if (!res.ok) {
    const text = await res.text();
    return (
      <main style={{ padding: 24 }}>
        <h1>Wurple</h1>
        <p>Couldn't load archived puzzle.</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {`Status: ${res.status}\n${text.slice(0, 300)}`}
        </pre>
        <Link href="/wurple" className="underline">
          Play Today's Puzzle
        </Link>
      </main>
    );
  }
  const initialDaily = await res.json();

  return (
    <main className=" bg-bg-app text-text">
        <WurpleClient initialDaily={initialDaily} />
          <div className="mb-8 mt-2 flex flex-col items-center gap-3 text-sm">
          <Link
            href="/wurple"
            className="text-link underline underline-offset-4 opacity-80 hover:opacity-100 hover:text-link-hover transition"
          >
            Go to Today's Puzzle
          </Link>

          <Link
            href="/wurple/archive"
            className="text-link underline underline-offset-4 opacity-80 hover:opacity-100 hover:text-link-hover transition"
          >
            Return to Archive Calendar
          </Link>
        </div>
    </main>
  );
}
