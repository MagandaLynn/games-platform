export type DoorPhase = "awaiting_riddle" | "debate" | "opened";

export type DoorMessage = {
  id: string;
  from: "player" | "door" | "system";
  text: string;
  ts: number;
};

export type SuggestedRiddle = {
  id: string;
  title: string;
  riddleText: string;
  tags?: string[];
};

export type DoorSession = {
  sessionId: string;

  // The riddle currently presented to the door (full text stored for replay)
  riddleText: string | null;
  suggestedRiddleId: string | null;

  phase: DoorPhase;

  // Door commits to a wrong answer claim for comedic continuity
  doorClaim: string | null;

  // Progression counters
  challengeCount: number; // how many player messages since riddle was presented (excluding the riddle itself)

  // Global gating mechanic (external to riddle)
  latchPrimed: boolean;

  messages: DoorMessage[];
};

export type DoorBrainInput = {
  session: DoorSession;
  playerText: string;
};

export type DoorBrainOutput = {
  doorText: string;

  // Structured signals used by the engine (not "beliefs")
  signals?: Partial<{
    setDoorClaim: string;
    primeLatch: boolean;
    openDoor: boolean;
    addSystemMessage: string;
  }>;
};
