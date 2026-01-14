import { games } from "@playseed/game-core"

// later: import { prisma } from "@playseed/db";

export function getWurpleSeededState() {
  return games.wurple.createInitialState('01-06-2026', {
    mode: 'easy',
    maxGuesses: 6,
    allowDuplicates: false,
    includeDistance: false,
    includeTiles: true,
    requireUniqueSolutionDigits: true,
  });
}
