type HangmanMode = "daily" | "custom";

export function buildShareText({

  wrongGuesses,
  maxWrongGuesses,
  hintUsed,
  origin,      // e.g. window.location.origin
  instanceId,
  mode,
}: {
  wrongGuesses: number;
  maxWrongGuesses: number;
  hintUsed: boolean;
  origin: string;
  instanceId: string;
  mode: HangmanMode;
}) {
  const hangmanEmoji = (wrong: number, maxWrong: number) => {
    // 0..maxWrong -> 0..6
    const stages = ["😀", "😐", "😟", "😨", "😰", "😰", "😵"];
    const denom = Math.max(1, maxWrong);
    const idx = Math.min(stages.length - 1, Math.floor((wrong / denom) * (stages.length - 1)));
    return stages[idx];
  };

  const title = mode === "daily" ? "Daily Hangman" : "Custom Hangman";
  const hintText = hintUsed ? " (hint used)" : "";

  // ✅ One link that works for both daily + custom:
  const playUrl = `${origin}/hangman/i/${instanceId}`;

  return (
    `${title}${hintText}\n` +
    `Mistakes: ${wrongGuesses}/${maxWrongGuesses} ${hangmanEmoji(wrongGuesses, maxWrongGuesses)}\n` +
    `Play: ${playUrl}`
  );
}
