// Mulberry32 PRNG (small, deterministic)
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic Fisher-Yates shuffle
export function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = arr.slice(); // T[]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));

    const tmp = a[i]!;   // i is always in-bounds
    a[i] = a[j]!;        // j is always in-bounds (0..i)
    a[j] = tmp;
  }
  return a;
}

