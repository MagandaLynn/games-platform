"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ColorDisplay from "./components/ColorDisplay";
import Keyboard from "./components/Keyboard";
import GuessesDisplay from "./components/GuessesDisplay";
import Distance from "./components/Distance";
import ModeToggle from "./components/ModeToggle";

import type { DailyResponse, GuessFeedback, GuessResponse, WurpleMode } from "./helpers/types";

import { buildHeatmap } from "./helpers/helpers";
import { keyframes } from "./helpers/animations";
import { buildShareText } from "./helpers/share-results";

import { loadRun, saveRun } from "./wurpleStorage";

export default function WurpleClient({ initialDaily }: { initialDaily: DailyResponse }) {
  const [seed] = useState(initialDaily.seed);
  const [mode, setMode] = useState<WurpleMode>(initialDaily.mode ?? "easy");

  const [rulesVersion, setRulesVersion] = useState(initialDaily.rulesVersion);
  const [rules, setRules] = useState({
    maxGuesses: initialDaily.maxGuesses,
    allowDuplicates: initialDaily.allowDuplicates,
    includeTiles: initialDaily.includeTiles,
    includeDistance: initialDaily.includeDistance,
  });

  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<GuessFeedback[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [input, setInput] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastRevealedRow, setLastRevealedRow] = useState<number>(-1);
  const [revealId, setRevealId] = useState(0);

  const [lastKey, setLastKey] = useState<string | null>(null);

  const submitLock = useRef(false);

  const guessCount = guesses.length;
  const gameOver = status !== "playing";

  const heatmap = useMemo(() => buildHeatmap(feedbackHistory), [feedbackHistory]);

  const usedInCurrent = useMemo(() => {
    const s = new Set(input.toUpperCase().split(""));
    s.delete("");
    return s;
  }, [input]);

  async function loadDailyAndHydrate(nextMode: WurpleMode) {
    setError(null);

    const res = await fetch(`/api/wurple/daily?seed=${encodeURIComponent(seed)}&mode=${nextMode}`, {
      cache: "no-store",
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.error ?? "Failed to load daily");
    }

    setRules({
      maxGuesses: payload.maxGuesses,
      allowDuplicates: payload.allowDuplicates,
      includeTiles: payload.includeTiles,
      includeDistance: payload.includeDistance,
    });
    setRulesVersion(payload.rulesVersion);

    const saved = loadRun(seed, nextMode);

    if (saved) {
      setGuesses(saved.guesses ?? []);
      setFeedbackHistory(saved.feedbackHistory ?? []);
      setStatus(saved.status ?? "playing");

      setLastRevealedRow(-1);
      setRevealId(0);

      setInput("");
      setError(null);
      return;
    }

    setGuesses([]);
    setFeedbackHistory([]);
    setStatus("playing");
    setInput("");

    setLastRevealedRow(-1);
    setRevealId(0);
  }

  useEffect(() => {
    loadDailyAndHydrate(mode).catch((err) => {
      console.error("Error loading daily:", err);
      setError(`Error loading daily: ${err.message}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, mode]);

  async function submitGuess() {
    if (submitLock.current) return;
    if (status !== "playing") return;
    if (input.length !== 6) return;

    submitLock.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/wurple/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          seed,
          mode,
          guess: input,
          previousGuesses: guesses,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError(payload?.error ?? `Guess failed (${res.status})`);
        return;
      }

      const data = payload as GuessResponse;
      const normalizedGuess = String(data.normalizedGuess ?? "");
      const feedback = data.feedback as GuessFeedback | undefined;

      if (!normalizedGuess || !feedback) {
        setError(`Server response missing feedback. ${JSON.stringify(data)}`);
        return;
      }

      if (rules.includeTiles && !Array.isArray(feedback.tiles)) {
        setError(`Server response missing tiles. ${JSON.stringify(data)}`);
        return;
      }

      if (guesses[guesses.length - 1] === normalizedGuess) {
        return;
      }

      const nextGuesses = [...guesses, normalizedGuess];
      const nextHistory = [...feedbackHistory, feedback];

      setGuesses(nextGuesses);
      setFeedbackHistory(nextHistory);
      setStatus(data.status);
      setInput("");

      setRevealId((x) => x + 1);
      setLastRevealedRow(nextHistory.length - 1);

      saveRun({
        seed,
        mode,
        guesses: nextGuesses,
        feedbackHistory: nextHistory,
        status: data.status,
        rulesVersion: data.rulesVersion ?? rulesVersion,
        updatedAt: Date.now(),
      });
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center mt-4">
      <style>{keyframes}</style>

      <ModeToggle mode={mode} setMode={setMode} />

      <ColorDisplay seed={seed} mode={mode} guessHex={guesses[guesses.length - 1] ?? ""} />

      {rules.includeDistance && <Distance feedbackHistory={feedbackHistory} />}

      {error && (
        <p className="mt-2 text-sm font-medium text-red-500">
          {error}
        </p>
      )}

      <GuessesDisplay
        feedbackHistory={feedbackHistory}
        input={input}
        status={status}
        lastRevealedRow={lastRevealedRow}
        revealId={revealId}
        rowsToDisplay={typeof rules.maxGuesses === "number" ? rules.maxGuesses : feedbackHistory.length + 1}
      />

      <Keyboard
        status={status}
        input={input}
        isSubmitting={isSubmitting}
        heatmap={heatmap}
        setInput={setInput}
        submitGuess={submitGuess}
        setError={setError}
        lastKey={lastKey}
        setLastKey={setLastKey}
        usedInCurrent={usedInCurrent}
        rules={rules}
      />

      {gameOver && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={async () => {
              const text = buildShareText({
                date: seed,
                mode,
                status,
                maxGuesses: rules.maxGuesses,
                feedbackHistory,
              });

              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="
              inline-flex items-center justify-center
              rounded-lg px-5 py-3
              text-base font-extrabold
              text-white
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

          {copied && (
            <div className="mt-2 text-sm font-semibold text-emerald-500">
              Copied!
            </div>
          )}
        </div>
      )}

      <div className="mt-4 mb-3 text-center text-sm opacity-90 space-y-1">
        <div>
          <span className="font-semibold">Date:</span> {seed}
        </div>
        <div>
          <span className="font-semibold">Guesses:</span> {guessCount} / {rules.maxGuesses ?? "∞"}
        </div>
        <div>
          <span className="font-semibold">Status:</span> {status}
        </div>
      </div>
    </div>
  );
}
