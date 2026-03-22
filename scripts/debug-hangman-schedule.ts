import path from "node:path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../packages/db/.env");
config({ path: envPath });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL! })),
  log: ["error", "warn"],
});

async function main() {
  console.log("=== HangmanDailySchedule (Pre-planned calendar) ===");
  const schedules = await prisma.hangmanDailySchedule.findMany({
    orderBy: { date: "asc" },
    take: 10,
    include: { puzzle: { select: { phrase: true, category: true } } },
  });
  
  console.log(`Total scheduled: ${schedules.length} (showing first 10)`);
  schedules.forEach((s) => {
    const isoDate = s.date.toISOString();
    const displayDate = isoDate.split("T")[0];
    console.log(`  ${displayDate} (${isoDate}) -> "${s.puzzle.phrase}" (${s.puzzle.category})`);
  });

  console.log("\n=== HangmanDailyInstance (Actual game instances) ===");
  const instances = await prisma.hangmanDailyInstance.findMany({
    orderBy: { date: "asc" },
    take: 10,
    include: {
      puzzle: { select: { phrase: true, category: true } },
      plays: { select: { id: true, status: true } },
    },
  });
  
  console.log(`Total instances: ${instances.length} (showing first 10)`);
  instances.forEach((i) => {
    const dateStr = i.date.toISOString();
    const playCount = i.plays.length;
    console.log(`  ${dateStr} [${i.mode}] -> "${i.puzzle.phrase}" (${playCount} plays)`);
  });

  console.log("\n=== Potential Issues ===");
  
  // Check for date mismatches
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  const todaySchedule = await prisma.hangmanDailySchedule.findFirst({
    where: {
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });
  
  const todayInstance = await prisma.hangmanDailyInstance.findFirst({
    where: {
      mode: "daily",
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`Today's date (UTC midnight): ${today.toISOString()}`);
  console.log(`Today's schedule exists: ${!!todaySchedule}`);
  console.log(`Today's instance exists: ${!!todayInstance}`);
  
  if (todaySchedule && todayInstance) {
    const scheduleDate = todaySchedule.date.toISOString();
    const instanceDate = todayInstance.date.toISOString();
    console.log(`Schedule date: ${scheduleDate}`);
    console.log(`Instance date: ${instanceDate}`);
    console.log(`Dates match: ${scheduleDate === instanceDate}`);
    console.log(`Puzzle IDs match: ${todaySchedule.puzzleId === todayInstance.puzzleId}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
