"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HangmanKeyboard } from "../components/HangmanKeyboard";
import { PhraseTiles } from "../components/PhraseTiles";
import { StatusArea } from "../components/StatusArea";
import { upsertHangmanRecord } from "../helpers/hangmanStats";
import { buildShareText } from "../helpers/sharing";
import Toast from "@/app/appComponents/Toast";
import { useToast } from "@/app/hooks/useToast";
import { redirect } from "next/navigation";

type Play = {
  masked: string;
  guessed: string[];
  wrongGuesses: number;
  maxWrong: number;
  remaining: number;
  status: "playing" | "won" | "lost";
  isComplete: boolean;

  correctLetters: string[];
  wrongLetters: string[];

  hintUsed: boolean;
  hintUsedAt?: string | null;

  // ✅ NEW (null while playing)
  solution?: string | null;

  // ✅ handy for share correctness
  mode?: "daily" | "custom" | string;
};

export default function DailyHangmanClient({
  instanceId,
  category,
  hint,
}: {
  instanceId: string;
  category: string | null;
  hint: string | null;
}) {
  const [play, setPlay] = useState<Play | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showHint, setShowHint] = useState(false);
  const [copied, setCopied] = useState(false);

  const { message } = useToast();

  const savedResultRef = useRef(false);
  const [showAnswer, setShowAnswer] = useState(false)

  const gameOver = play?.status === "won" || play?.status === "lost";

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

  // ✅ keep showHint synced after play loads / updates
  useEffect(() => {
    if (!play) return;
    setShowHint(!!play.hintUsed);
  }, [play?.hintUsed]);

  const onGuess = useCallback(
    async (letter: string) => {
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

  const onRevealHint = useCallback(async () => {
    if (!hint) return;
    if (!play) return;
    if (play.hintUsed) {
      setShowHint(true);
      return;
    }

    setShowHint(true);
    setError(null);

    const res = await fetch("/api/hangman/hint-used", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ instanceId }),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      setError(`hint-used failed: ${res.status} ${text}`);
      return;
    }

    setPlay((prev) =>
      prev ? { ...prev, hintUsed: true, hintUsedAt: new Date().toISOString() } : prev
    );
  }, [hint, instanceId, play]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

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
    if (!play) return;
    if (play.status !== "playing") return;

    const handler = (e: KeyboardEvent) => {
      const ch = e.key.toUpperCase();
      if (ch.length !== 1) return;
      if (ch < "A" || ch > "Z") return;
      void onGuess(ch);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [play, onGuess]);

  useEffect(() => {
    if (!play) return;
    if (play.status === "playing") return;
    if (savedResultRef.current) return;

    savedResultRef.current = true;

    upsertHangmanRecord({
      puzzleKey: instanceId,
      completedAtISO: new Date().toISOString(),
      status: play.status,
      wrongGuesses: play.wrongGuesses,
      maxWrong: play.maxWrong,
      hintUsed: !!play.hintUsed,
    });
  }, [play, instanceId]);

  useEffect(() => {
    savedResultRef.current = false;
  }, [instanceId]);

  if (error) return <pre className="whitespace-pre-wrap">{error}</pre>;
  if (!play) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-w-2xl mx-auto">
        <StatusArea
          category={category}
          hint={hint}
          onRevealHint={onRevealHint}
          showHint={play.hintUsed || showHint}
          wrongGuesses={play.wrongGuesses}
          maxWrongGuesses={play.wrongGuesses + play.remaining}
          status={play.status}
        />

        <PhraseTiles masked={play.masked} revealDelayMs={300} />

        {/* ✅ show answer after win/loss */}
        <div className="flex justify-center m-4">{gameOver && play.solution && <>{showAnswer? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="text-xs font-semibold text-text-muted">Answer</div>
            <div className="mt-1 text-lg font-extrabold tracking-wide">{play.solution}</div>
          </div>
        ):<button className="px-2 py-1 text-xs font-semibold border transition text-text hover:opacity-90 hover:scale-[1.05] rounded" onClick={()=>setShowAnswer(true)}>Show Answer</button>}</>}
      </div></div>

      {gameOver && (
        <div className="mt-5 text-center flex gap-3 justify-center">
          <button
            type="button"
            onClick={async () => {
              const text = buildShareText({
                wrongGuesses: play.wrongGuesses,
                maxWrongGuesses: play.wrongGuesses + play.remaining,
                hintUsed: !!play.hintUsed,
                origin: window.location.origin,
                instanceId,
                mode: (play.mode as any) ?? "daily",
              });

              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="
              inline-flex items-center justify-center
              rounded-lg px-5 py-3
              text-base font-extrabold text-white
              bg-easy hover:bg-easyHover
              active:scale-[0.98]
              transition duration-150 ease-out
              shadow-sm
              focus:outline-none
              focus-visible:ring-2 focus-visible:ring-easy
              focus-visible:ring-offset-2 focus-visible:ring-offset-bgPanel
            "
          >
            Share
          </button>
          <button
            type="button"
            onClick={async () => {
              redirect(`/hangman/create`);
              }}
            className="
              inline-flex items-center justify-center
              rounded-lg px-5 py-3
              text-base font-extrabold text-white
              bg-challenge hover:bg-challengeHover
              active:scale-[0.98]
              transition duration-150 ease-out
              shadow-sm
              focus:outline-none
              focus-visible:ring-2 focus-visible:ring-easy
              focus-visible:ring-offset-2 focus-visible:ring-offset-bgPanel
            "
          >
            Create your own
          </button>

          {copied && <div className="mt-2 text-sm font-semibold text-emerald-500">Copied!</div>}
          {message && <Toast message={message} />}
        </div>
      )}

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
