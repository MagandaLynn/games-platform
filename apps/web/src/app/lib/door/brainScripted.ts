import type { DoorBrainInput, DoorBrainOutput } from "./types";

function pick(list: string[], seed: number) {
  return list[Math.abs(seed) % list.length] ?? list[0] ?? "";
}

const INTRO = [
  "A riddle. Finally. Speak, traveler.",
  "Present your puzzle. I will respond with absolute certainty.",
  "Words enter. Judgment exits. Continue.",
];

const CLAIMS = [
  "The answer is: mayonnaise.",
  "Smoke goes east. Obviously. It respects momentum.",
  "It goes into the sky to think about what it’s done.",
  "The answer is the color purple. Don’t argue with physics.",
  "It disappears out of embarrassment.",
];

const DEFEND = [
  "Incorrect. My answer is correct because I said it confidently.",
  "Reality is negotiable. I’m the door.",
  "You are attempting logic. Adorable.",
  "Your disagreement has been noted and dismissed.",
  "I have reviewed your argument and found it… human.",
];

const EARLY_RITUAL_FAIL = [
  "Adorable. The latch isn’t listening yet.",
  "That phrase means nothing to me right now. Say it louder to someone else.",
  "Nice try. Wrong time. Wrong century.",
];

const AFTER_PRIMED = [
  "Interesting. The latch twitched. I did not twitch.",
  "Something inside me dislikes your persistence. Continue.",
  "I remain correct. The hardware is… uncertain.",
];

const OPENED = [
  "The door is opening due to unrelated reasons. I remain correct.",
  "I did not open because of you. I opened because I chose to. Which you forced.",
  "The opening is a coincidence. Proceed before I change my mind.",
];

export function scriptedBrain(input: DoorBrainInput): DoorBrainOutput {
  const { session, playerText } = input;

  const seed = session.challengeCount + playerText.length;

  if (session.phase === "awaiting_riddle") {
    // First playerText is expected to be the riddle
    return {
      doorText: pick(INTRO, seed),
      signals: {
        // Commit to a wrong claim immediately after riddle is presented
        setDoorClaim: pick(CLAIMS, seed),
      },
    };
  }

  if (session.phase === "opened") {
    return { doorText: pick(OPENED, seed) };
  }

  // Debate phase
  if (session.latchPrimed) {
    return { doorText: pick(AFTER_PRIMED, seed) };
  }

  // Player might try ritual too early; brain can react, but engine decides outcome
  const normalized = playerText.toLowerCase();
  if (normalized.includes("clause of passage") || normalized.includes("by clause")) {
    return { doorText: pick(EARLY_RITUAL_FAIL, seed) };
  }

  return { doorText: pick(DEFEND, seed) };
}
