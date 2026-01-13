"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ColorDisplay from "./components/ColorDisplay";
import Keyboard from "./components/Keyboard";
import GuessesDisplay from "./components/GuessesDisplay";
import Distance from "./components/Distance";
import ModeToggle from "./components/ModeToggle";

import type {
  DailyResponse,
  GuessFeedback,
  GuessResponse,
  WurpleMode,
} from "./helpers/types";

import { buildHeatmap } from "./helpers/helpers";
import { keyframes } from "./helpers/animations";
import { buildShareText } from "./helpers/share-results";

import { loadRun, saveRun } from "./wurpleStorage";

export default function WurpleClient({ initialDaily }: { initialDaily: DailyResponse }) {
  // Seed is fixed for the page render (daily puzzle)
  const [seed] = useState(initialDaily.seed);

  // Mode can toggle, each has its own storage key + rules
  const [mode, setMode] = useState<WurpleMode>("easy");

  // Rules come from /api/wurple/daily
  const [rulesVersion, setRulesVersion] = useState(initialDaily.rulesVersion);
  const [rules, setRules] = useState({
    maxGuesses: initialDaily.maxGuesses,         // number | null
    allowDuplicates: initialDaily.allowDuplicates,
    includeTiles: initialDaily.includeTiles,
    includeDistance: initialDaily.includeDistance,
  });

  // Play state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<GuessFeedback[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [input, setInput] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation control
  const [lastRevealedRow, setLastRevealedRow] = useState<number>(-1);
  const [revealId, setRevealId] = useState(0);

  // Keyboard pop
  const [lastKey, setLastKey] = useState<string | null>(null);

  // Hard lock against double submit (double click / enter spam)
  const submitLock = useRef(false);

  const guessCount = guesses.length;
  const gameOver = status !== "playing";

  // Heatmap based on revealed feedback (tiles only matter when present)
  const heatmap = useMemo(() => buildHeatmap(feedbackHistory), [feedbackHistory]);

  // Prevent duplicates while typing (easy mode usually)
  const usedInCurrent = useMemo(() => {
    const s = new Set(input.toUpperCase().split(""));
    s.delete("");
    return s;
  }, [input]);

  /**
   * Load rules for current (seed, mode) from API,
   * then hydrate run from localStorage if present.
   * If no saved run, reset for fresh run.
   */
  async function loadDailyAndHydrate(nextMode: WurpleMode) {
    setError(null);

    const res = await fetch(
      `/api/wurple/daily?seed=${encodeURIComponent(seed)}&mode=${nextMode}`,
      { cache: "no-store" }
    );

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
      // Restore saved run
      setGuesses(saved.guesses ?? []);
      setFeedbackHistory(saved.feedbackHistory ?? []);
      setStatus(saved.status ?? "playing");

      // Don’t re-animate on hydration
      setLastRevealedRow(-1);
      setRevealId(0);

      setInput("");
      setError(null);
      return;
    }

    // Fresh run
    setGuesses([]);
    setFeedbackHistory([]);
    setStatus("playing");
    setInput("");

    setLastRevealedRow(-1);
    setRevealId(0);
  }

  // On mount + whenever mode changes, load rules + hydrate for that mode.
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

      // If UI expects tiles, enforce tiles in that mode
      if (rules.includeTiles && !Array.isArray(feedback.tiles)) {
        setError(`Server response missing tiles. ${JSON.stringify(data)}`);
        return;
      }

      // Prevent double-append if something weird happens
      if (guesses[guesses.length - 1] === normalizedGuess) {
        return;
      }

      const nextGuesses = [...guesses, normalizedGuess];
      const nextHistory = [...feedbackHistory, feedback];

      setGuesses(nextGuesses);
      setFeedbackHistory(nextHistory);
      setStatus(data.status);
      setInput("");

      // Animate only the newly revealed row
      setRevealId((x) => x + 1);
      setLastRevealedRow(nextHistory.length - 1);

      // Persist
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
    <div
      style={{
        marginTop: 16,
        maxWidth: 560,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style>{keyframes}</style>

      <ModeToggle mode={mode} setMode={setMode} />

      {/* Top swatch (target + guess) */}
      <ColorDisplay
        seed={seed}
        mode={mode}
        guessHex={guesses[guesses.length - 1] ?? ""}
      />

      {rules.includeDistance && <Distance feedbackHistory={feedbackHistory} />}

      {error && (
        <p style={{ marginTop: 10, color: "crimson" }}>
          {error}
        </p>
      )}

      <GuessesDisplay
        feedbackHistory={feedbackHistory}
        input={input}
        status={status}
        lastRevealedRow={lastRevealedRow}
        revealId={revealId}
        rowsToDisplay={typeof rules.maxGuesses === "number"
          ? rules.maxGuesses
          : feedbackHistory.length + 1}
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
        <div style={{ marginTop: 20, textAlign: "center" }}>
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
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              background: "#2563eb",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Share
          </button>

          {copied && (
            <div style={{ marginTop: 8, color: "#22c55e", fontWeight: 600 }}>
              Copied!
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, marginBottom: 12, textAlign: "center" }}>
        <div>
          <strong>Date:</strong> {seed}
        </div>
        <div>
          <strong>Guesses:</strong> {guessCount} / {rules.maxGuesses ?? "∞"}
        </div>
        <div>
          <strong>Status:</strong> {status}
        </div>
      </div>
    </div>
  );
}
