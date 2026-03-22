import type { DoorSession } from "./types";

export const DOOR_RULES = {
  // What the player can say to force the door open (case-insensitive normalize in engine)
  ritualPhrases: [
    "by clause of passage, open",
    "clause of passage",
    "open by clause of passage",
  ],

  // When the latch becomes primed (after enough challenges)
  primeAfterChallenges: 3,

  // Optional: add extra flavor system messages when primed
  primedSystemMessage:
    "Something shifts inside the door. The latch feels… listenable.",
};

export function isRitualPhrase(normalizedPlayerText: string): boolean {
  return DOOR_RULES.ritualPhrases.some((p) => normalizedPlayerText.includes(p));
}

export function shouldPrimeLatch(session: DoorSession): boolean {
  return !session.latchPrimed && session.challengeCount >= DOOR_RULES.primeAfterChallenges;
}
