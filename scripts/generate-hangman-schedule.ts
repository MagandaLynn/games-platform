import path from "node:path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../packages/db/.env");
config({ path: envPath });


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Expected it in packages/db/.env");
}
else {
  console.log("Using DATABASE_URL from packages/db/.env");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL! })),
  log: ["error", "warn"],
});


// If you want “tomorrow onward”, this produces tomorrow at 00:00Z.
function utcMidnight(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

async function main() {
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 365;
  if (!Number.isFinite(days) || days <= 0) throw new Error("Invalid --days");

  const startArg = process.argv.find((a) => a.startsWith("--start="));
  // --start=2026-01-16 (interpreted as UTC date)
  const start = startArg
    ? utcMidnight(new Date(`${startArg.split("=")[1]}T00:00:00Z`))
    : addDaysUTC(utcMidnight(), 1); // default: tomorrow UTC

  const puzzles = await prisma.hangmanPuzzle.findMany({
    where: { isDailyEligible: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (puzzles.length === 0) {
    throw new Error("No puzzles with isDailyEligible=true");
  }

  const end = addDaysUTC(start, days);
  const existing = await prisma.hangmanDailySchedule.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true },
  });

  const existingSet = new Set(existing.map((r) => r.date.toISOString()));

  const rows: { date: Date; puzzleId: string }[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDaysUTC(start, i);
    const key = date.toISOString();
    if (existingSet.has(key)) continue;

    const puzzleId = puzzles[i % puzzles.length].id;
    rows.push({ date, puzzleId });
  }

  if (rows.length === 0) {
    console.log("No new schedule rows needed.");
    return;
  }

  for (const row of rows) {
    await prisma.hangmanDailySchedule.create({ data: row });
  }

  console.log(
    `Created ${rows.length} HangmanDailySchedule rows from ${start.toISOString()} for ~${days} days.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
