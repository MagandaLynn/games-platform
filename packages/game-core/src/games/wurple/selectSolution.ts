import { hashSeed, normalizeSeed } from "./seed";
import { mulberry32, shuffle } from "./prng";

const HEX_ALPHABET = "0123456789ABCDEF".split("");

type SolutionOptions = {
  requireUniqueDigits?: boolean;
  requireAtLeastOneDuplicate?: boolean;
};

function allUnique(chars: string[]): boolean {
  return new Set(chars).size === chars.length;
}

export function selectDailyHexSolution(
  dateSeed: string | number,
  opts: SolutionOptions = {}
): string {
  const seedStr = normalizeSeed(dateSeed);
  const h = hashSeed(seedStr);
  const rand = mulberry32(h);

  // EASY: guarantee no repeats
  if (opts.requireUniqueDigits) {
    const shuffled = shuffle(HEX_ALPHABET, rand);
    return shuffled.slice(0, 6).join("");
  }

  // CHALLENGE (or default): allow repeats
  const chars: string[] = Array.from({ length: 6 }, () => {
    const idx = Math.floor(rand() * 16); // 0..15
    return HEX_ALPHABET[idx]!;
  });

  // If we specifically want at least one repeat, enforce it deterministically.
  if (!opts.requireUniqueDigits) {
    if (allUnique(chars)) {
      // pick two different positions deterministically
      const i1 = Math.floor(rand() * 6);
      let i2 = Math.floor(rand() * 6);
      if (i2 === i1) i2 = (i2 + 1) % 6;

      chars[i2] = chars[i1]!;
    }
  }

  return chars.join("");
}
