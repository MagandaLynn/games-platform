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
    it("does not increment wrongGuesses on repeated guess (default ignoreRepeatedGuesses=true)", () => {
    const s0 = createInitialState("ABC", { maxWrong: 6 }); // default ignoreRepeatedGuesses
    const s1 = applyGuess(s0, "Z"); // wrong
    expect(s1.wrongGuesses).toBe(1);

    const s2 = applyGuess(s1, "Z"); // repeat
    expect(s2.wrongGuesses).toBe(1);
    expect(s2.status).toBe("playing");
    expect(s2.error).toBeTruthy(); // "Already guessed"
  });

  it("repeated guess does not change status (still playing)", () => {
    const s0 = createInitialState("A", { maxWrong: 6 });
    const s1 = applyGuess(s0, "B"); // wrong
    const s2 = applyGuess(s1, "B"); // repeat

    expect(s2.status).toBe("playing");
    expect(s2.wrongGuesses).toBe(s1.wrongGuesses);
  });
});
