// Deterministic string hash (FNV-1a-ish)
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function normalizeSeed(dateSeed: string | number): string {
  return String(dateSeed).trim();
}
