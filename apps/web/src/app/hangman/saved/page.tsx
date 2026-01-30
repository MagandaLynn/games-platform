import Link from "next/link";
import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
// If using Clerk:
// import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  puzzle: {
    id: string;
    phrase: string;
    hint: string | null;
    category: string | null;
    createdAt: Date;
  };
  lastInstanceId: string | null;
  savedAt: Date;
};

function previewPhrase(phrase: string) {
  // Don’t show the full answer; keep it teasing
  const trimmed = (phrase ?? "").trim();
  return trimmed.length <= 20 ? trimmed : trimmed.slice(0, 20) + "…";
}

export default async function SavedHangmanPuzzlesPage() {
  const sessionId = await requireSessionId();
  const userId = null as string | null; // replace with Clerk auth() if you want
  // const { userId } = auth();

  const rows = (await prisma.savedHangmanPuzzle.findMany({
    where: userId ? { userId } : { sessionId },
    orderBy: { savedAt: "desc" },
    select: {
      id: true,
      savedAt: true,
      puzzle: {
        select: {
          id: true,
          phrase: true,
          hint: true,
          category: true,
          createdAt: true,
        },
      },
      // optional convenience: store last played instanceId in the table
      lastInstanceId: true,
    },
  })) as Row[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Saved Hangman Puzzles</h1>
        <Link
          href="/hangman/create"
          className="rounded-xl bg-link px-4 py-2 text-sm font-extrabold text-white hover:opacity-90 transition"
        >
          Create one
        </Link>
      </div>

      <p className="mt-2 text-sm text-text-muted">
        Your bookmarked puzzles. (If you’re not signed in, these are saved to this device/session.)
      </p>

      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-text-muted">
            Nothing saved yet. Go play something cursed and hit “Save.” 🙂
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-text">
                    {r.puzzle.category ? `${r.puzzle.category}: ` : ""}
                    <span className="text-text-muted">{previewPhrase(r.puzzle.phrase)}</span>
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    {r.puzzle.hint ? `Hint: ${r.puzzle.hint}` : "No hint"}
                    {" • "}
                    Saved {new Date(r.savedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/hangman/p/${r.puzzle.id}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-extrabold hover:opacity-90 transition"
                  >
                    New play
                  </Link>

                  {r.lastInstanceId && (
                    <Link
                      href={`/hangman/i/${r.lastInstanceId}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-extrabold hover:opacity-90 transition"
                    >
                      Continue
                    </Link>
                  )}

                  <form action={`/api/hangman/puzzles/${r.puzzle.id}/save`} method="post">
                    {/* optional: if you prefer server actions later, swap this */}
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
