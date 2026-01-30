import "dotenv/config";
import { prisma } from "../packages/db/src/client.js";

const TEST_CATEGORY = "Test"; // change to match yours

async function main() {
  const puzzles = await prisma.hangmanPuzzle.findMany({
    where: { category: TEST_CATEGORY },
    select: { id: true, phrase: true },
  });

  const puzzleIds = puzzles.map(p => p.id);
  if (puzzleIds.length === 0) {
    console.log("No puzzles found for category:", TEST_CATEGORY);
    return;
  }

  // Schedules referencing these puzzles
  await prisma.hangmanDailySchedule.deleteMany({
    where: { puzzleId: { in: puzzleIds } },
  });

  // Instances referencing these puzzles
  const instances = await prisma.hangmanDailyInstance.findMany({
    where: { puzzleId: { in: puzzleIds } },
    select: { id: true },
  });
  const instanceIds = instances.map(i => i.id);

  // Plays referencing instances
  if (instanceIds.length) {
    await prisma.hangmanPlay.deleteMany({
      where: { instanceId: { in: instanceIds } },
    });

    await prisma.hangmanDailyInstance.deleteMany({
      where: { id: { in: instanceIds } },
    });
  }

  // Finally delete puzzles
  const result = await prisma.hangmanPuzzle.deleteMany({
    where: { id: { in: puzzleIds } },
  });

  console.log("Deleted puzzles:", result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
