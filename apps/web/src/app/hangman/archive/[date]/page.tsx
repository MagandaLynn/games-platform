import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@playseed/db";
import DailyHangmanClient from "../../daily/DailyHangmanClient";

export const runtime = "nodejs";

function parseArchiveDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatArchiveDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function HangmanArchiveDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsedDate = parseArchiveDate(date);
  if (!parsedDate) notFound();

  const schedule = await prisma.hangmanDailySchedule.findUnique({
    where: { date: parsedDate },
    include: {
      puzzle: true,
    },
  });

  if (!schedule) notFound();

  const instance = await prisma.hangmanDailyInstance.upsert({
    where: { date_mode: { date: parsedDate, mode: "daily" } },
    update: { puzzleId: schedule.puzzleId },
    create: { date: parsedDate, mode: "daily", puzzleId: schedule.puzzleId },
    include: { puzzle: true },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-1 text-center sm:text-left">
        <div className="text-sm font-semibold text-text">{formatArchiveDate(parsedDate)}</div>
        <div className="text-xs text-text-muted">
          {instance.puzzle.category?.trim() || "Uncategorized"}
          {instance.puzzle.hint ? ` • Hint: ${instance.puzzle.hint}` : ""}
        </div>
      </div>

      <DailyHangmanClient
        instanceId={instance.id}
        category={instance.puzzle.category ?? null}
        hint={instance.puzzle.hint ?? null}
      />

      <div className="mt-6 flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-center">
        <Link
          href="/hangman/daily"
          className="text-link underline underline-offset-4 opacity-85 transition hover:opacity-100 hover:text-link-hover"
        >
          Go to Today&apos;s Puzzle
        </Link>

        <Link
          href="/hangman/archive"
          className="text-link underline underline-offset-4 opacity-85 transition hover:opacity-100 hover:text-link-hover"
        >
          Return to Archive
        </Link>
      </div>
    </main>
  );
}