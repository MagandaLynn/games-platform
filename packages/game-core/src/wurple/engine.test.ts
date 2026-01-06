import { describe, it, expect } from "vitest";
import { applyGuess, createInitialState, getResult, isGameOver } from "./engine";

describe("hex wurple engine", () => {
  it("deterministically selects the same solution for the same seed", () => {
    const a = createInitialState("2026-01-06");
    const b = createInitialState("2026-01-06");
    expect(a.solution).toBe(b.solution);
  });

  it("solution is valid hex and has no repeated digits", () => {
    const s = createInitialState("2026-01-06");
    expect(s.solution).toMatch(/^[0-9A-F]{6}$/);
    expect(new Set(s.solution).size).toBe(6);
  });

  it("throws on invalid guess (wrong chars / length)", () => {
    const s = createInitialState("2026-01-06");
    expect(() => applyGuess(s, "12345")).toThrow();     // too short
    expect(() => applyGuess(s, "12345G")).toThrow();    // invalid char
  });

  it("throws on repeated digits", () => {
    const s = createInitialState("2026-01-06");
    expect(() => applyGuess(s, "A1A2B3")).toThrow();
  });

  it("win: result is won when solution guessed", () => {
    const s0 = createInitialState("2026-01-06");
    const s1 = applyGuess(s0, s0.solution);
    expect(isGameOver(s1)).toBe(true);
    expect(getResult(s1).status).toBe("won");
  });

  it("loss: result is lost after max guesses without solution", () => {
    const s0 = createInitialState("2026-01-06");

    // Create a valid wrong guess with unique chars that is not the solution:
    const wrong = s0.solution === "012345" ? "FEDCBA" : "012345";

    let s = s0;
    for (let i = 0; i < s0.maxGuesses; i++) {
      s = applyGuess(s, wrong);
    }

    expect(isGameOver(s)).toBe(true);
    const res = getResult(s);
    expect(res.status).toBe("lost");
  });
});
