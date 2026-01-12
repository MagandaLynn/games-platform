import { games } from "@playseed/game-core"

// later: import { prisma } from "@playseed/db";

export function getWurpleSeededState() {
  return games.wurple.createInitialState('01-06-2026');
}
