import "dotenv/config";
import { prisma } from "@playseed/db";
export const runtime = "nodejs";

async function main() {
  const puzzles = [
    {
      phrase: "HELLO WORLD",
      hint: "Classic programming greeting",
      category: "Tech",
      isDailyEligible: true,
    },
    {
      phrase: "BANANA FOR SCALE",
      hint: "Internet measurement unit",
      category: "Memes",
      isDailyEligible: true,
    },
    {
      phrase: "THEATER UP",
      hint: "Your people",
      category: "Theatre",
      isDailyEligible: true,
    },
  ];

  for (const p of puzzles) {
    const existing = await prisma.hangmanPuzzle.findFirst({
      where: { phrase: p.phrase },
    });
    if (existing) {
      await prisma.hangmanPuzzle.update({
        where: { id: existing.id },
        data: p,
      });
    } else {
      await prisma.hangmanPuzzle.create({
        data: p,
      });
    }
  }

  const count = await prisma.hangmanPuzzle.count({ where: { isDailyEligible: true } });
  console.log(`Seeded. Daily eligible puzzles: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
