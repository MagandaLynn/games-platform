// DailyHangmanClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HangmanKeyboard } from "../components/HangmanKeyboard";
import { PhraseTiles } from "../components/PhraseTiles";

type Play = {
  masked: string;
  guessed: string[];
  wrongGuesses: number;
  maxWrong: number;
  remaining: number;
  status: "playing" | "won" | "lost";
  isComplete: boolean;
  // these come from your API now (keep them!)
  correctLetters: string[];
  wrongLetters: string[];
};

export default function DailyHangmanClient({ instanceId }: { instanceId: string }) {
  const [play, setPlay] = useState<Play | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setError(null);

    const res = await fetch("/api/hangman/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ instanceId }),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      setError(`state failed: ${res.status} ${text}`);
      return;
    }

    const data = JSON.parse(text);
    setPlay(data.play as Play);
  }, [instanceId]);

  const onGuess = useCallback(
    async (letter: string) => {
      // client-side guards (avoid useless requests)
      const current = play;
      if (!current) return;
      if (current.status !== "playing") return;
      if (current.guessed.includes(letter)) return;

      setError(null);

      const res = await fetch("/api/hangman/guess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instanceId, letter }),
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) {
        setError(`guess failed: ${res.status} ${text}`);
        return;
      }

      const data = JSON.parse(text);
      setPlay(data.play as Play);
    },
    [instanceId, play]
  );

  useEffect(() => {
    void loadState();
  }, [loadState]);

  // Prefer the server-calculated buckets (best, since server knows the phrase).
  // Fallback to a masked-based heuristic only if buckets are missing.
  const correctLetters = useMemo(() => {
    if (!play) return [] as string[];
    if (Array.isArray(play.correctLetters)) return play.correctLetters;

    const revealedSet = new Set(
      (play.masked ?? "").toUpperCase().replace(/[^A-Z]/g, "").split("")
    );
    return (play.guessed ?? []).filter((ch) => revealedSet.has(ch));
  }, [play]);

  const wrongLetters = useMemo(() => {
    if (!play) return [] as string[];
    if (Array.isArray(play.wrongLetters)) return play.wrongLetters;

    const revealedSet = new Set(
      (play.masked ?? "").toUpperCase().replace(/[^A-Z]/g, "").split("")
    );
    return (play.guessed ?? []).filter((ch) => !revealedSet.has(ch));
  }, [play]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ch = e.key.toUpperCase();
      if (ch.length !== 1) return;
      if (ch < "A" || ch > "Z") return;
      void onGuess(ch);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onGuess]);

  if (error) return <pre className="whitespace-pre-wrap">{error}</pre>;
  if (!play) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        {/* <div className="text-3xl font-semibold tracking-widest">{play.masked}</div> */}
        <PhraseTiles masked={play.masked} />
        <div className="mt-2 text-sm opacity-80">
          Status: <span className="font-semibold">{play.status}</span>
        </div>

        <div className="text-sm opacity-80">
          Wrong:{" "}
          <span className="font-semibold">
            {play.wrongGuesses} / {play.maxWrong}
          </span>
        </div>

        <div className="text-sm opacity-80">
          Guessed:{" "}
          <span className="font-semibold">{play.guessed.join(", ") || "—"}</span>
        </div>
      </div>

      <HangmanKeyboard
        disabled={play.status !== "playing"}
        guessed={play.guessed}
        correctLetters={correctLetters}
        wrongLetters={wrongLetters}
        onGuess={(letter) => void onGuess(letter)}
      />
    </div>
  );
}
