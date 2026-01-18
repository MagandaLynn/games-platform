"use client";

import * as React from "react";

type Props = {
  wrongGuesses: number; // 0..maxWrong
  maxWrong?: number; // default 6
  className?: string;
};

type PartKey = "head" | "body" | "armL" | "armR" | "legL" | "legR";

const PART_ORDER: PartKey[] = ["head", "body", "armL", "armR", "legL", "legR"];

const drawAnim = (len: number) =>
  ({
    strokeDasharray: len,
    strokeDashoffset: len,
    animation: "hangman-draw 520ms ease-out forwards",
  } as React.CSSProperties);

export function HangmanFigure({ wrongGuesses, maxWrong = 6, className }: Props) {
  const clamped = Math.max(0, Math.min(wrongGuesses, maxWrong));

  const partsToShow = Math.min(
    PART_ORDER.length,
    Math.round((clamped / maxWrong) * PART_ORDER.length)
  );

  const prevPartsRef = React.useRef<number>(partsToShow);
  const [animatePart, setAnimatePart] = React.useState<PartKey | null>(null);

  const [animateFace, setAnimateFace] = React.useState(false);
  const [showDeadFace, setShowDeadFace] = React.useState(false);

  const lost = wrongGuesses >= maxWrong;

  // ---- NEW: sway on each increase in wrongGuesses ----
  const prevWrongRef = React.useRef<number>(wrongGuesses);
  const [sway, setSway] = React.useState(false);

  React.useEffect(() => {
    const prev = prevWrongRef.current;

    // Trigger sway only when wrong guesses increase
    if (wrongGuesses > prev) {
      setSway(true);
      const t = window.setTimeout(() => setSway(false), 520);
      prevWrongRef.current = wrongGuesses;
      return () => window.clearTimeout(t);
    }

    prevWrongRef.current = wrongGuesses;
  }, [wrongGuesses]);
  // -----------------------------------------------

  React.useEffect(() => {
    const prev = prevPartsRef.current;

    if (partsToShow > prev) {
      const newest = PART_ORDER[partsToShow - 1] ?? null;
      setAnimatePart(newest);
      const t = window.setTimeout(() => setAnimatePart(null), 320);
      prevPartsRef.current = partsToShow;
      return () => window.clearTimeout(t);
    }

    prevPartsRef.current = partsToShow;
  }, [partsToShow]);

  // Show and animate face after a delay when we newly enter "lost"
  const prevLostRef = React.useRef(lost);
  React.useEffect(() => {
    const FACE_DELAY_MS = 500; // change to 3000 if you really want 3 seconds

    if (lost && !prevLostRef.current) {
      const showTimer = window.setTimeout(() => {
        setShowDeadFace(true);
        setAnimateFace(true);

        const animTimer = window.setTimeout(() => setAnimateFace(false), 350);
        // NOTE: we can't return a cleanup from inside setTimeout; we just schedule and rely on outer cleanup.
        window.clearTimeout(animTimer);
      }, FACE_DELAY_MS);

      prevLostRef.current = lost;
      return () => window.clearTimeout(showTimer);
    }

    if (!lost) {
      setShowDeadFace(false);
      setAnimateFace(false);
    }

    prevLostRef.current = lost;
  }, [lost]);

  const visible = new Set(PART_ORDER.slice(0, partsToShow));

  const LEN = {
    head: 90,
    body: 65,
    arm: 50,
    leg: 55,
    face: 80,
  };

  const isAnim = (k: PartKey) => animatePart === k;
  const faceStyle = animateFace ? drawAnim(LEN.face) : undefined;

  // Pivot: rope attaches at x=140, y=30 (top beam). That’s our pendulum origin.
  const swayStyle: React.CSSProperties | undefined = sway
    ? {
        transformOrigin: "140px 30px",
        animation: "hangman-sway 1040ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
      }
    : undefined;

  return (
    <div className={["w-full flex justify-center", className].filter(Boolean).join(" ")}>
      <svg
        viewBox="0 0 220 220"
        className="w-full max-w-[260px] h-auto"
        role="img"
        aria-label="Hangman figure"
      >
        <style>{`
          @keyframes hangman-draw { to { stroke-dashoffset: 0; } }

          /* Gentle pendulum: left -> right -> settle */
          @keyframes hangman-sway {
            0%   { transform: rotate(0deg); }
            18%  { transform: rotate(-5deg); }
            45%  { transform: rotate(4deg); }
            72%  { transform: rotate(-2deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>

        {/* Scaffold (rigid) */}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-700/60 dark:text-zinc-300/80"
        >
          <path d="M20 200 H140" />
          <path d="M50 200 V30" />
          <path d="M50 30 H140" />
          <path d="M50 60 L80 30" />
          {/* NOTE: rope moved into swaying group below */}
        </g>

        {/* Rope + Person (sways together) */}
        <g style={swayStyle}>
          {/* Rope */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-700/60 dark:text-zinc-300/80"
          >
            <path d="M140 30 V55" />
          </g>

          {/* Person */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-900/80 dark:text-zinc-100/90"
          >
            {visible.has("head") && (
              <circle
                cx="140"
                cy="78"
                r="18"
                style={isAnim("head") ? drawAnim(LEN.head) : undefined}
              />
            )}

            {visible.has("body") && (
              <path
                d="M140 96 V145"
                style={isAnim("body") ? drawAnim(LEN.body) : undefined}
              />
            )}

            {visible.has("armL") && (
              <path
                d="M140 112 L118 128"
                style={isAnim("armL") ? drawAnim(LEN.arm) : undefined}
              />
            )}
            {visible.has("armR") && (
              <path
                d="M140 112 L162 128"
                style={isAnim("armR") ? drawAnim(LEN.arm) : undefined}
              />
            )}

            {visible.has("legL") && (
              <path
                d="M140 145 L122 175"
                style={isAnim("legL") ? drawAnim(LEN.leg) : undefined}
              />
            )}
            {visible.has("legR") && (
              <path
                d="M140 145 L158 175"
                style={isAnim("legR") ? drawAnim(LEN.leg) : undefined}
              />
            )}

            {/* Dead face (only on loss after delay) */}
            {showDeadFace && visible.has("head") && (
              <g style={faceStyle}>
                <path d="M134 73 l-4 -4" />
                <path d="M130 73 l4 -4" />
                <path d="M150 73 l-4 -4" />
                <path d="M146 73 l4 -4" />
                <path d="M132 87 H148" />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
