import path from "node:path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

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

function normalizeCategory(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v.length ? v : "uncategorized";
}

function parseCsvArg(name: string): string[] {
  const arg = process.argv.find((a) => a.startsWith(`${name}=`));
  if (!arg) return [];
  return arg
    .split("=")[1]
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function seededRng(seed: string) {
  let state = Number.parseInt(
    crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8),
    16
  );

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function main() {
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const days = daysArg ? Number(daysArg.split("=")[1]) : 365;
  if (!Number.isFinite(days) || days <= 0) throw new Error("Invalid --days");

  const replace = hasFlag("--replace");
  const replaceAll = hasFlag("--replace-all");
  const wipeDailyInstances = hasFlag("--wipe-daily-instances");
  const excludeCategories = new Set(parseCsvArg("--exclude-categories"));

  const seedArg = process.argv.find((a) => a.startsWith("--seed="));
  const seedValue = seedArg?.split("=")[1] ?? `${Date.now()}`;
  const rand = seededRng(seedValue);

  const startArg = process.argv.find((a) => a.startsWith("--start="));
  // --start=2026-01-16 (interpreted as UTC date)
  const start = startArg
    ? utcMidnight(new Date(`${startArg.split("=")[1]}T00:00:00Z`))
    : addDaysUTC(utcMidnight(), 1); // default: tomorrow UTC

  const end = addDaysUTC(start, days);

  const puzzles = await prisma.hangmanPuzzle.findMany({
    where: { isDailyEligible: true },
    select: { id: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  const filteredPuzzles = puzzles.filter((p) => {
    const cat = normalizeCategory(p.category).toLowerCase();
    return !excludeCategories.has(cat);
  });

  if (filteredPuzzles.length === 0) {
    throw new Error("No puzzles with isDailyEligible=true");
  }

  const pools = new Map<string, string[]>();
  for (const p of filteredPuzzles) {
    const cat = normalizeCategory(p.category);
    const list = pools.get(cat) ?? [];
    list.push(p.id);
    pools.set(cat, list);
  }

  for (const ids of pools.values()) {
    shuffleInPlace(ids, rand);
  }

  const categoryNames = [...pools.keys()];

  if (replaceAll) {
    if (wipeDailyInstances) {
      const dailyInstances = await prisma.hangmanDailyInstance.findMany({
        where: { mode: "daily" },
        select: { id: true },
      });

      const dailyInstanceIds = dailyInstances.map((d) => d.id);

      if (dailyInstanceIds.length) {
        await prisma.hangmanPlay.deleteMany({
          where: { instanceId: { in: dailyInstanceIds } },
        });
      }

      await prisma.hangmanDailyInstance.deleteMany({ where: { mode: "daily" } });
    }

    await prisma.hangmanDailySchedule.deleteMany({});
  } else if (replace) {
    if (wipeDailyInstances) {
      const dailyInstances = await prisma.hangmanDailyInstance.findMany({
        where: { mode: "daily", date: { gte: start, lt: end } },
        select: { id: true },
      });

      const dailyInstanceIds = dailyInstances.map((d) => d.id);

      if (dailyInstanceIds.length) {
        await prisma.hangmanPlay.deleteMany({
          where: { instanceId: { in: dailyInstanceIds } },
        });
      }

      await prisma.hangmanDailyInstance.deleteMany({
        where: { mode: "daily", date: { gte: start, lt: end } },
      });
    }

    await prisma.hangmanDailySchedule.deleteMany({
      where: { date: { gte: start, lt: end } },
    });
  }

  const existing = await prisma.hangmanDailySchedule.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true, puzzleId: true },
  });

  const existingDates = new Set(existing.map((r) => r.date.toISOString()));
  const usedPuzzleIds = new Set(existing.map((r) => r.puzzleId));

  if (days > filteredPuzzles.length && (replace || replaceAll)) {
    throw new Error(
      `Requested ${days} days but only ${filteredPuzzles.length} eligible puzzles after exclusions. ` +
        `Current schema requires unique puzzleId in HangmanDailySchedule.`
    );
  }

  const rows: { date: Date; puzzleId: string; category: string }[] = [];
  let prevCategory: string | null = null;

  for (let i = 0; i < days; i++) {
    const date = addDaysUTC(start, i);
    const key = date.toISOString();
    if (existingDates.has(key)) continue;

    const availableCategories = categoryNames.filter((cat) => {
      const ids = pools.get(cat) ?? [];
      return ids.some((id) => !usedPuzzleIds.has(id));
    });

    if (availableCategories.length === 0) {
      break;
    }

    const nonRepeat = availableCategories.filter((cat) => cat !== prevCategory);
    const categoryPool = nonRepeat.length ? nonRepeat : availableCategories;
    const chosenCategory = categoryPool[Math.floor(rand() * categoryPool.length)];

    const ids = pools.get(chosenCategory) ?? [];
    const nextId = ids.find((id) => !usedPuzzleIds.has(id));
    if (!nextId) continue;

    usedPuzzleIds.add(nextId);
    rows.push({ date, puzzleId: nextId, category: chosenCategory });
    prevCategory = chosenCategory;
  }

  if (rows.length === 0) {
    console.log("No new schedule rows needed.");
    return;
  }

  for (const row of rows) {
    await prisma.hangmanDailySchedule.create({
      data: { date: row.date, puzzleId: row.puzzleId },
    });
  }

  const byCategory = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    `Created ${rows.length} HangmanDailySchedule rows from ${start.toISOString()} for ~${days} days.`
  );
  console.log(`Seed used: ${seedValue}`);
  console.log("Category distribution:", byCategory);
  if (excludeCategories.size) {
    console.log("Excluded categories:", [...excludeCategories]);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
