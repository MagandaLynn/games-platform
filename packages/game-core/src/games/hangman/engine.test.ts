import { describe, it, expect } from "vitest";
import { createInitialState, applyGuess, getResult } from "./engine";

describe("hangman engine", () => {
  it("masks letters and reveals punctuation", () => {
    const s = createInitialState("Hi, Bob!");
    const r = getResult(s);
    expect(r.masked).toBe("__, ___!");
  });

  it("wins when all letters guessed", () => {
    let s = createInitialState("AB");
    s = applyGuess(s, "a");
    s = applyGuess(s, "b");
    expect(getResult(s).status).toBe("won");
  });

  it("loses after max wrong guesses", () => {
    let s = createInitialState("A", { maxWrong: 2 });
    s = applyGuess(s, "x");
    s = applyGuess(s, "y");
    expect(getResult(s).status).toBe("lost");
  });

  it("repeated guesses do not add wrong guesses", () => {
    let s = createInitialState("A", { maxWrong: 6, ignoreRepeatedGuesses: true });
    s = applyGuess(s, "x");
    const r1 = getResult(s);
    s = applyGuess(s, "x");
    const r2 = getResult(s);
    expect(r2.wrongGuesses).toBe(r1.wrongGuesses);
  });
});
