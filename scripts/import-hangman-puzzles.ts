// scripts/import-hangman-puzzles.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../packages/db/src/client.js";

function normalize(raw: string) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^A-Z' ]/g, "")
    .replace(/\s+/g, " ");
}

function isValid(phrase: string) {
  const letters = phrase.replace(/[^A-Z]/g, "");
  if (letters.length < 4) return false;
  if (letters.length > 24) return false; // tune
  const words = phrase.split(" ").filter(Boolean);
  if (words.length > 4) return false;
  if ((phrase.match(/'/g) || []).length > 1) return false;
  return true;
}

function autoHint(category: string, phrase: string) {
  const letters = phrase.replace(/[^A-Z]/g, "").length;
  const words = phrase.split(" ").filter(Boolean).length;
  return `Category: ${category} • ${words} word${words === 1 ? "" : "s"} • ${letters} letters`;
}

async function main() {
  // Example: a file with one phrase per line
  const category = process.argv[2] ?? "General";
  const file = process.argv[3] ?? "data/phrases.txt";
  const fullPath = path.join(process.cwd(), file);

  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${fullPath}`);
    console.error(`\nUsage: pnpm tsx scripts/import-hangman-puzzles.ts "Category" path/to/file.txt`);
    console.error(`\nCreate the file with one phrase per line, then run this command again.`);
    process.exit(1);
  }

  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);

  let created = 0;
  let skipped = 0;

  for (const line of lines) {
    const phrase = normalize(line);
    if (!phrase) continue;
    if (!isValid(phrase)) {
      skipped++;
      continue;
    }

    // Check if puzzle already exists
    const existing = await prisma.hangmanPuzzle.findFirst({
      where: { phrase },
    });

    if (existing) {
      // Update existing puzzle
      await prisma.hangmanPuzzle.update({
        where: { id: existing.id },
        data: {
          category,
        
          isDailyEligible: true,
        },
      });
    } else {
      // Create new puzzle
      await prisma.hangmanPuzzle.create({
        data: {
          phrase,
          category,
          isDailyEligible: true,
        },
      });
    }

    created++;
  }

  console.log({ created, skipped });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
