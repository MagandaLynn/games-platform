import { describe, it, expect } from "vitest";
import { applyGuess, createInitialState, getInternalResult, isGameOver } from "./engine";
import { ModeConfig } from "./types";
const EASY_CFG: ModeConfig = {
  mode: "easy",
  maxGuesses: 6,
  allowDuplicates: false,
  includeDistance: false,
  includeTiles: true,
  requireUniqueSolutionDigits: true,
};

describe("hex wurple engine", () => {
  it("deterministically selects the same solution for the same seed + mode", () => {
    const a = createInitialState("2026-01-06", EASY_CFG);
    const b = createInitialState("2026-01-06", EASY_CFG);
    expect(a.solution).toBe(b.solution);
  });

  it("solution is valid hex and (in easy mode) has no repeated digits", () => {
    const s = createInitialState("2026-01-06", EASY_CFG);
    expect(s.solution).toMatch(/^[0-9A-F]{6}$/);
    expect(new Set(s.solution).size).toBe(6);
  });

  it("throws on invalid guess (wrong chars / length)", () => {
    const s = createInitialState("2026-01-06", EASY_CFG);
    expect(() => applyGuess(s, "12345", EASY_CFG)).toThrow();     // too short
    expect(() => applyGuess(s, "12345G", EASY_CFG)).toThrow();    // invalid char
  });

  it("throws on repeated digits", () => {
    const s = createInitialState("2026-01-06", EASY_CFG);
    expect(() => applyGuess(s, "A1A2B3", EASY_CFG)).toThrow();
  });

  it("win: result is won when solution guessed", () => {
    const s0 = createInitialState("2026-01-06", EASY_CFG);
    const s1 = applyGuess(s0, s0.solution, EASY_CFG);
    expect(isGameOver(s1)).toBe(true);
    expect(getInternalResult(s1, EASY_CFG).status).toBe("won");
  });

  it("loss: result is lost after max guesses without solution", () => {
    const s0 = createInitialState("2026-01-06", EASY_CFG);

    // Valid wrong guess with unique chars that isn't the solution
    const wrong = s0.solution === "012345" ? "FEDCBA" : "012345";

    let s = s0;
    for (let i = 0; i < (s0.maxGuesses ?? 0); i++) {
      s = applyGuess(s, wrong, EASY_CFG);
    }

    expect(isGameOver(s)).toBe(true);
    const res = getInternalResult(s, EASY_CFG);
    expect(res.status).toBe("lost");
  });
});
