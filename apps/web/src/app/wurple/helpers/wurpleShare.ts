import { doShare } from "@/app/helpers/doShare";
export type WurpleShareInput = {
  seed: string;
  mode: "easy" | "challenge";
  status: "won" | "lost" | "playing";
  guessCount: number;
  maxGuesses: number | null;
  // optional extras if you have them
  shareTextOverride?: string;
};

function buildWurpleShareText(input: WurpleShareInput) {
  const { mode, status, guessCount, maxGuesses } = input;

  if (input.shareTextOverride) return input.shareTextOverride;

  if (status === "playing") {
    return `Wurple (${mode}) — in progress`;
  }

  const denom = typeof maxGuesses === "number" ? `/${maxGuesses}` : "";
  return status === "won"
    ? `Wurple (${mode}) — solved in ${guessCount}${denom}`
    : `Wurple (${mode}) — not solved (${guessCount}${denom})`;
}

export async function shareWurple(input: WurpleShareInput) {
  const url = `${window.location.origin}/wurple?seed=${encodeURIComponent(
    input.seed
  )}&mode=${encodeURIComponent(input.mode)}`;

  const title = "Wurple";
  const text = buildWurpleShareText(input);

  return doShare({ title, text, url });
}
