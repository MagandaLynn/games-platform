export const HEX_GRID: string[][] = [
  ["0", "1", "2", "3"],
  ["4", "5", "6", "7"],
  ["8", "9", "A", "B"],
  ["C", "D", "E", "F"],
];

export const COLS = 6;

export const MAX_GUESSES = 6;

export const RULES_VERSION = 1;

export const HEX_KEYS = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"] as const;


export const MAX_RGB_DISTANCE = Math.sqrt(255 * 255 * 3); // ~441.67