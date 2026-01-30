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

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL! })),
  log: ["error", "warn"],
});

async function main() {
  const total = await prisma.hangmanPuzzle.count();
  const eligible = await prisma.hangmanPuzzle.count({ where: { isDailyEligible: true } });
  
  console.log(`Total puzzles: ${total}`);
  console.log(`Daily eligible puzzles: ${eligible}`);
  
  if (total > 0 && eligible === 0) {
    console.log("Marking all puzzles as daily eligible...");
    const result = await prisma.hangmanPuzzle.updateMany({
      data: { isDailyEligible: true }
    });
    console.log(`Updated ${result.count} puzzles`);
  } else if (eligible > 0) {
    console.log("Puzzles are already marked as eligible!");
  } else {
    console.log("No puzzles found in database. Please import puzzles first.");
  }
  
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
