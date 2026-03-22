export type PublicPlay = {
  masked: string;
  guessed: string[];
  remaining: number;
  wrongGuesses: number;
  maxWrong: number;
  status: "playing" | "won" | "lost";
  isComplete: boolean;
  correctLetters: string[];
  wrongLetters: string[];
  solution: string | null;
  mode?: string;
};

type EngineResult = {
  masked: string;
  guessed: string[];
  remaining: number;
  wrongGuesses: number;
  maxWrong?: number;
  status: "playing" | "won" | "lost";
  isComplete: boolean;
};

export function canonicalizeGuessed(s: string) {
  return Array.from(new Set((s ?? "").split("").filter(Boolean))).sort().join("");
}

export function computeLetterBuckets(phrase: string, guessed: string[]) {
  const P = (phrase ?? "").toUpperCase();
  const correctLetters: string[] = [];
  const wrongLetters: string[] = [];

  for (const ch of guessed) {
    if (!ch) continue;
    if (P.includes(ch)) correctLetters.push(ch);
    else wrongLetters.push(ch);
  }

  return { correctLetters, wrongLetters };
}

export function toPublicPlay(result: EngineResult, phrase: string, mode?: string): PublicPlay {
  const guessed = Array.isArray(result.guessed) ? result.guessed : [];
  const { correctLetters, wrongLetters } = computeLetterBuckets(phrase, guessed);
  const isOver = result.status !== "playing";

  return {
    masked: result.masked,
    guessed,
    remaining: result.remaining,
    wrongGuesses: result.wrongGuesses,
    maxWrong: result.maxWrong ?? result.wrongGuesses + result.remaining,
    status: result.status,
    isComplete: result.isComplete,
    correctLetters,
    wrongLetters,
    solution: isOver ? phrase : null,
    ...(mode ? { mode } : {}),
  };
}
