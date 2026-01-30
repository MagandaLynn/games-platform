// app/hangman/create/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@playseed/db";
import { utcMidnight } from "@/server/date";
export const runtime = "nodejs";

function normalizePhrase(raw: string) {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

function validatePhrase(phrase: string) {
  if (!phrase) return "Phrase is required.";
  if (phrase.length > 80) return "Phrase is too long (max 80).";
  if (!/[A-Z]/.test(phrase)) return "Phrase must include at least one letter (A–Z).";
  return null;
}

export default function CreateHangmanPuzzlePage() {
  async function createPuzzle(formData: FormData) {
    "use server";

    const phraseRaw = String(formData.get("phrase") ?? "");
    const hintRaw = String(formData.get("hint") ?? "");
    const categoryRaw = String(formData.get("category") ?? "");

    const phrase = normalizePhrase(phraseRaw);
    const hint = hintRaw.trim() ? hintRaw.trim() : null;
    const category = categoryRaw.trim() ? categoryRaw.trim() : null;

    const err = validatePhrase(phrase);
    if (err) redirect(`/hangman/create?error=${encodeURIComponent(err)}`);

    const puzzle = await prisma.hangmanPuzzle.create({
      data: { phrase, hint, category, isDailyEligible: false },
      select: { id: true },
    });

    // For custom puzzles, use current timestamp to ensure uniqueness
    const instance = await prisma.hangmanDailyInstance.create({
      data: { date: new Date(), mode: "custom", puzzleId: puzzle.id },
      select: { id: true },
    });
    

    redirect(`/hangman/create/success?instanceId=${instance.id}`);

  }



  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Create a Hangman Puzzle</h1>
      <p className="mt-2 text-sm text-text-muted">
        Numbers and emojis are allowed. At least one A–Z letter required.
      </p>

      <form action={createPuzzle} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">Phrase</label>
          <input
            name="phrase"
            required
            maxLength={80}
            placeholder="e.g. 50 FIRST DATES 🏝️"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-link/40"
          />
          <p className="text-xs text-text-muted">Max 80 chars.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">Hint (optional)</label>
          <input
            name="hint"
            maxLength={120}
            placeholder="e.g. Rom-com on a beach"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-link/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">Category (optional)</label>
          <input
            name="category"
            maxLength={40}
            placeholder="e.g. Movies"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-link/40"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-link px-4 py-2.5 text-sm font-extrabold text-white hover:opacity-90 transition"
        >
          Create Puzzle
        </button>
      </form>
    </div>
  );
}
