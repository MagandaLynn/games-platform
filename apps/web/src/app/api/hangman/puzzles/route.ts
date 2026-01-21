import { prisma } from "@playseed/db";
import { utcMidnight } from "@/server/date";
export const runtime = "nodejs";

function normalizePhrase(raw: string) {
  // Keep emojis/numbers/punctuation. Just trim + collapse whitespace + uppercase.
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

function validatePhrase(phrase: string) {
  if (!phrase) return "Phrase is required.";
  if (phrase.length > 80) return "Phrase is too long (max 80).";

  // Must contain at least one A–Z letter to be playable.
  if (!/[A-Z]/.test(phrase)) return "Phrase must include at least one letter (A–Z).";

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const phraseRaw = String(body.phrase ?? "");
    const hintRaw = body.hint == null ? null : String(body.hint);
    const categoryRaw = body.category == null ? null : String(body.category);

    const phrase = normalizePhrase(phraseRaw);
    const hint = hintRaw?.trim() ? hintRaw.trim() : null;
    const category = categoryRaw?.trim() ? categoryRaw.trim() : null;

    const err = validatePhrase(phrase);
    if (err) return Response.json({ error: err }, { status: 400 });

    const puzzle = await prisma.hangmanPuzzle.create({
      data: {
        phrase,
        hint,
        category,
        isDailyEligible: false,
      },
      select: { id: true, hint: true, category: true },
    });

    // Create a custom instance so the share link can always be instance-based.
    const instance = await prisma.hangmanDailyInstance.create({
      data: {
        date: utcMidnight(new Date()),
        mode: "custom",
        puzzleId: puzzle.id,
      },
      select: { id: true },
    });

    return Response.json({
      puzzleId: puzzle.id,
      instanceId: instance.id,
      hint: puzzle.hint ?? null,
      category: puzzle.category ?? null,
    });
  } catch (e: any) {
    console.error("[hangman/puzzles][POST]", e);
    return Response.json(
      {
        error: "create puzzle failed",
        message: e?.message ?? String(e),
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
