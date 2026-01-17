import { prisma } from "@playseed/db";
import { utcMidnight } from "@/server/date";

type Mode = "daily" | "custom";

function normalizeMode(input: unknown): Mode {
  return input === "custom" ? "custom" : "daily";
}

function dayRange(date = utcMidnight()) {
  const start = date;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function handleDaily(date = utcMidnight()) {
  const { start, end } = dayRange(date);

  const schedule = await prisma.hangmanDailySchedule.findFirst({
    where: { date: { gte: start, lt: end } },
    include: { puzzle: true },
    orderBy: { date: "asc" },
  });

  if (!schedule) {
    return Response.json(
      { error: "No daily puzzle scheduled for this date.", date: start.toISOString() },
      { status: 404 }
    );
  }

  const instance = await prisma.hangmanDailyInstance.upsert({
    where: { date_mode: { date: utcMidnight(schedule.date), mode: "daily" } },
    update: { puzzleId: schedule.puzzleId },
    create: { date: utcMidnight(schedule.date), mode: "daily", puzzleId: schedule.puzzleId },
    include: { puzzle: true },
  });

  return Response.json({
    instanceId: instance.id,
    mode: "daily",
    date: instance.date.toISOString(),
    hint: instance.puzzle.hint ?? null,
    category: instance.puzzle.category ?? null,
  });
}

export async function GET() {
  try {
    return await handleDaily();
  } catch (e: any) {
    console.error("[create-instance][GET]", e);
    return Response.json(
      {
        error: "create-instance failed",
        message: e?.message ?? String(e),
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const mode = normalizeMode(body.mode);

    if (mode === "daily") return await handleDaily();

    const puzzleId: string | undefined = body.puzzleId;
    if (!puzzleId) {
      return Response.json({ error: "puzzleId is required for custom instances" }, { status: 400 });
    }

    const puzzle = await prisma.hangmanPuzzle.findUnique({ where: { id: puzzleId } });
    if (!puzzle) return Response.json({ error: "Puzzle not found" }, { status: 404 });

    const instance = await prisma.hangmanDailyInstance.create({
      data: { date: new Date(), mode: "custom", puzzleId },
      include: { puzzle: true },
    });

    return Response.json({
      instanceId: instance.id,
      mode: "custom",
      date: instance.date.toISOString(),
      hint: instance.puzzle.hint ?? null,
      category: instance.puzzle.category ?? null,
    });
  } catch (e: any) {
    console.error("[create-instance][POST]", e);
    return Response.json(
      {
        error: "create-instance failed",
        message: e?.message ?? String(e),
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
