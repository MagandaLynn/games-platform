import type { DoorMessage, DoorSession } from "./types";
import { scriptedBrain } from "./brainScripted";
import { isRitualPhrase, shouldPrimeLatch, DOOR_RULES } from "./doorRules";

function uid() {
  return Math.random().toString(36).slice(2);
}
function now() {
  return Date.now();
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function addMsg(session: DoorSession, from: DoorMessage["from"], text: string): DoorSession {
  const msg: DoorMessage = { id: uid(), from, text, ts: now() };
  return { ...session, messages: [...session.messages, msg] };
}

export function newDoorSession(): DoorSession {
  const s: DoorSession = {
    sessionId: uid(),
    riddleText: null,
    suggestedRiddleId: null,
    phase: "awaiting_riddle",
    doorClaim: null,
    challengeCount: 0,
    latchPrimed: false,
    messages: [{ id: uid(), from: "door", text: "Speak, traveler. Present a riddle.", ts: now() }],
  };
  return s;
}

export function applyPlayerText(prev: DoorSession, playerTextRaw: string): DoorSession {
  const playerText = playerTextRaw.trim();
  if (!playerText) return prev;

  let next = addMsg(prev, "player", playerText);

  // If awaiting riddle: store it and move to debate
  if (next.phase === "awaiting_riddle") {
    next = { ...next, riddleText: playerText, phase: "debate" };

    // Brain generates intro + sets wrong claim
    const out = scriptedBrain({ session: next, playerText });
    next = addMsg(next, "door", out.doorText);

    if (out.signals?.setDoorClaim) {
      next = addMsg(next, "door", `My answer is: ${out.signals.setDoorClaim}`);
      next = { ...next, doorClaim: out.signals.setDoorClaim };
    } else {
      // fallback claim if brain didn't set one
      next = { ...next, doorClaim: "mayonnaise" };
    }

    return next;
  }

  // If already opened: door just snarks
  if (next.phase === "opened") {
    const out = scriptedBrain({ session: next, playerText });
    next = addMsg(next, "door", out.doorText);
    return next;
  }

  // Debate: increment challenge count
  next = { ...next, challengeCount: next.challengeCount + 1 };

  // Prime latch if threshold reached
  if (shouldPrimeLatch(next)) {
    next = { ...next, latchPrimed: true };
    next = addMsg(next, "system", DOOR_RULES.primedSystemMessage);
  }

  const normalized = normalize(playerText);

  // Ritual only works if latchPrimed
  if (next.latchPrimed && isRitualPhrase(normalized)) {
    next = { ...next, phase: "opened" };
    next = addMsg(next, "system", "The latch clicks. The door opens.");
    // Door's reaction (still stubborn)
    const out = scriptedBrain({ session: next, playerText });
    next = addMsg(next, "door", out.doorText);
    return next;
  }

  // Otherwise, Door responds (never concedes)
  const out = scriptedBrain({ session: next, playerText });
  next = addMsg(next, "door", out.doorText);

  return next;
}
