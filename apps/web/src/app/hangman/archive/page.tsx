import { prisma } from "@playseed/db";
import HangmanArchiveCalendar from "./HangmanArchiveCalendar";

export const runtime = "nodejs";

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function HangmanArchivePage() {
  const schedules = await prisma.hangmanDailySchedule.findMany({
    where: { date: { lte: new Date() } },
    include: {
      puzzle: {
        select: {
          category: true,
          hint: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 180,
  });

  if (schedules.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="rounded-xl border border-dashed border-slate-300/70 bg-slate-50/80 px-4 py-8 text-center text-sm text-text-muted dark:border-white/10 dark:bg-white/5">
          No archived Hangman puzzles are available yet.
        </div>
      </main>
    );
  }

  const archiveByDate = Object.fromEntries(
    schedules.map((schedule) => [
      toDateKey(schedule.date),
      {
        date: toDateKey(schedule.date),
        category: schedule.puzzle.category ?? null,
        hint: schedule.puzzle.hint ?? null,
      },
    ])
  );

  const latestDate = toDateKey(schedules[0]!.date);
  const earliestDate = toDateKey(schedules[schedules.length - 1]!.date);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <HangmanArchiveCalendar
        archiveByDate={archiveByDate}
        initialDateKey={latestDate}
        minDateKey={earliestDate}
        maxDateKey={latestDate}
      />
    </main>
  );
}