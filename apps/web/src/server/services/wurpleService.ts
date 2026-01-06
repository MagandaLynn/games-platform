import { createInitialState } from "@btd/game-core";
// later: import { prisma } from "@btd/db";

export function getWurpleSeededState() {
  return createInitialState('01-06-2026');
}
