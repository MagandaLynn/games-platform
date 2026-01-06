import { hashSeed, normalizeSeed } from "./seed";
import { mulberry32, shuffle } from "./prng";

const HEX_ALPHABET = "0123456789ABCDEF".split("");

export function selectDailyHexSolution(dateSeed: string | number): string {
  const seedStr = normalizeSeed(dateSeed);
  const h = hashSeed(seedStr);
  const rand = mulberry32(h);

  const shuffled = shuffle(HEX_ALPHABET, rand);
  // Take the first 6 unique chars => guarantees no repeats
  return shuffled.slice(0, 6).join("");
}
