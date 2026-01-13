"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ColorDisplay from "./components/ColorDisplay";
import { DailyResponse, GuessFeedback, GuessResponse, WurpleMode } from "./helpers/types";
import { toGuessColor, buildHeatmap } from "./helpers/helpers";
import { keyframes } from "./helpers/animations";
import Keyboard from "./components/Keyboard";
import GuessesDisplay from "./components/GuessesDisplay";
import GameOver from "./components/GameOver";
import Distance from "./components/Distance";
import ModeToggle from "./components/ModeToggle";
import { buildShareText } from "./helpers/share-results";

export default function WurpleClient({ initialDaily }: { initialDaily: DailyResponse }) {
    const [seed] = useState(initialDaily.seed);
    const [maxGuesses] = useState(initialDaily.maxGuesses);
    const [guesses, setGuesses] = useState<string[]>([]);
    const [feedbackHistory, setFeedbackHistory] = useState<GuessFeedback[]>([]);
    const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const heatmap = useMemo(() => buildHeatmap(feedbackHistory), [feedbackHistory]);
    const [lastRevealedRow, setLastRevealedRow] = useState<number>(-1);
    const [revealId, setRevealId] = useState(0);
    const [lastKey, setLastKey] = useState<string | null>(null);
    const [mode, setMode] = useState<WurpleMode>("easy");
    const [rules, setRules] = useState({
        maxGuesses: initialDaily.maxGuesses,
        allowDuplicates: initialDaily.allowDuplicates,
        includeTiles: initialDaily.includeTiles,
        includeDistance: initialDaily.includeDistance,
    });
    const [copied, setCopied] = useState(false);

    const submitLock = useRef(false);

    async function loadDaily(nextMode: WurpleMode) {
        const res = await fetch(`/api/wurple/daily?seed=${encodeURIComponent(seed)}&mode=${nextMode}`, {
            cache: "no-store",
        });

        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.error ?? "Failed to load daily");
        console.log(`Loaded daily: seed=${payload.seed} mode=${nextMode}`);
        setMode(nextMode);
        setRules({  
            maxGuesses: payload.maxGuesses,
            allowDuplicates: payload.allowDuplicates,
            includeTiles: payload.includeTiles,
            includeDistance: payload.includeDistance,
        });

        // reset play state (new puzzle!)
        setGuesses([]);
        setFeedbackHistory([]);
        setStatus("playing");
        setInput("");
        setError(null);
        setRevealId(0);
    }

    useEffect(() => {
        loadDaily(mode).catch((err) => {
            console.error("Error loading daily:", err);
            setError(`Error loading daily: ${err.message}`);
        });
    }, [mode]); // load once on mount
    const guessCount = guesses.length;
    const gameOver = status !== "playing";
    const usedInCurrent = useMemo(() => {
        const s = new Set(input.toUpperCase().split(""));
        s.delete(""); // safety
        return s;
    }, [input]);

    const canSubmit = useMemo(() => {
        if (isSubmitting) return false;
        if (gameOver) return false;
        const max = rules.maxGuesses;
        const outOfGuesses = typeof max === "number" && guessCount >= max;

        return input.trim().length > 0;
    }, [isSubmitting, gameOver, guessCount, maxGuesses, input]);

  async function submitGuess() {
  if (submitLock.current) return;          // hard lock
  if (status !== "playing") return;
  if (input.length !== 6) return;

  submitLock.current = true;
  setError(null);
  setIsSubmitting(true);

  try {
    const res = await fetch("/api/wurple/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        seed,
        mode,                 // make sure you send mode now
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

    // Guard: don’t append duplicates if something weird happens
    const normalizedGuess = String(data.normalizedGuess ?? "");
    const feedback = data.feedback;

    if (!normalizedGuess || !feedback?.tiles) {
      setError(`Server response missing feedback. ${JSON.stringify(data)}`);
      return;
    }

    setGuesses((prev) =>
      prev[prev.length - 1] === normalizedGuess ? prev : [...prev, normalizedGuess]
    );

    setFeedbackHistory((prev) => {
    const next = [...prev, feedback];
    setLastRevealedRow(next.length - 1);
    return next;
    });


    setRevealId((x) => x + 1);
    setLastRevealedRow((row) => row + 1); // or: set to prev length, but see note below
    setStatus(data.status);
    setInput("");
  } finally {
    setIsSubmitting(false);
    submitLock.current = false;
  }
}

  return (
    <div style={{ marginTop: 16, maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{keyframes}</style>
        <ModeToggle mode={mode} setMode={setMode} />
        <ColorDisplay seed={seed} mode={mode} guessHex={guesses[guesses.length - 1] ?? ""} />
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
            rowsToDisplay={rules.maxGuesses ? rules.maxGuesses : feedbackHistory.length + 1}
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
        </div>
        )}
        {copied && (
            <div style={{ marginTop: 8, color: "#22c55e", fontWeight: 600 }}>
                Copied!
            </div>
)}


        <div style={{ marginBottom: 12 }}>
                <div><strong>Date:</strong> {seed}</div>
                <div><strong>Guesses:</strong> {guessCount} / {rules.maxGuesses ?? "∞"}</div>

                <div><strong>Status:</strong> {status}</div>
        </div>
    </div>
  );
}
