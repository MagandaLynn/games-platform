"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { games, TileStatus } from "@playseed/game-core";

const PLAYER_COLORS = ["#60a5fa", "#f97316", "#a78bfa", "#34d399", "#facc15", "#f472b6", "#22d3ee"];
const MAX_CHART_PLAYERS = PLAYER_COLORS.length;
const SEMANTLE_BASE_PUZZLE = 1513;
const SEMANTLE_BASE_DATE_UTC = new Date(Date.UTC(2026, 2, 22));
const WORDLE_BASE_PUZZLE = 1000;
const WORDLE_BASE_DATE_UTC = new Date(Date.UTC(2024, 2, 15));
const WURPLE_TILE_EMOJI: Record<TileStatus, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

type FollowItem = {
  profileId: string;
  handle: string;
  displayName: string | null;
  followedAt: string;
};

type BlockItem = {
  profileId: string;
  handle: string;
  displayName: string | null;
  blockedAt: string;
};

type CompareDay = {
  date: string;
  importedOn?: string | null;
  semantleRawText?: string | null;
  semantlePuzzleNumber?: number | null;
  semantleTopGuessNumber?: number | null;
  semantleTopScore?: number | null;
  semantleHintsUsed?: number | null;
  wordleRawText?: string | null;
  wordlePuzzleNumber?: number | null;
  wordleAttempts?: number | null;
  wordleMaxGuesses?: number | null;
  attempted: boolean;
  completed: boolean;
  won: boolean;
  lost: boolean;
  wrongGuesses: number | null;
  guessedCount: number;
  hintUsed: boolean;
  perfect: boolean;
};

type CompareEntry = {
  profileId: string;
  handle: string;
  displayName: string | null;
  summary: {
    totalPlayed: number;
    totalCompleted: number;
    attemptedNotCompletedDays: number;
    totalWon: number;
    totalLost: number;
    perfectCount: number;
    avgWrongGuesses: number;
    avgGuesses: number;
    winRate: number;
    hintUsageRate: number;
    perfectRate: number;
  };
  daily: CompareDay[];
};

type CompareResponse = {
  range: "30d" | "90d" | "all";
  from: string | null;
  to: string;
  isCapped?: boolean;
  maxLookbackDays?: number;
  availableDays: number;
  axisDates: string[];
  me: CompareEntry;
  follows: CompareEntry[];
};

type GameKind = "hangman" | "wurple" | "semantle" | "wordle";
type ChartMetric = "wrongGuesses" | "guessedCount";
type ChartTab = "hangman" | "wurpleEasy" | "wurpleChallenge" | "semantle" | "wordle";

type ChartDay = {
  date: string;
  attempted: boolean;
  completed: boolean;
  won: boolean;
  lost: boolean;
  wrongGuesses: number | null;
  guessedCount: number;
  hintUsed: boolean;
  perfect: boolean;
  value: number | null;
  highlight: boolean;
  importedOn?: string | null;
  semantleRawText?: string | null;
  semantlePuzzleNumber?: number | null;
  semantleTopGuessNumber?: number | null;
  semantleTopScore?: number | null;
  semantleHintsUsed?: number | null;
  wordleRawText?: string | null;
  wordlePuzzleNumber?: number | null;
  wordleAttempts?: number | null;
  wordleMaxGuesses?: number | null;
};

type ChartSeries = {
  profileId: string;
  label: string;
  color: string;
  summary: CompareEntry["summary"];
  daily: ChartDay[];
};

type TodayRow = {
  profileId: string;
  label: string;
  handle: string;
  isMe: boolean;
  hangmanDay: CompareDay | null;
  wurpleEasyDay: CompareDay | null;
  wurpleChallengeDay: CompareDay | null;
  semantleDay: CompareDay | null;
  wordleDay: CompareDay | null;
};

function emptyDay(date: string): CompareDay {
  return {
    date,
    importedOn: null,
    semantleRawText: null,
    semantlePuzzleNumber: null,
    semantleTopGuessNumber: null,
    semantleTopScore: null,
    semantleHintsUsed: null,
    wordleRawText: null,
    wordlePuzzleNumber: null,
    wordleAttempts: null,
    wordleMaxGuesses: null,
    attempted: false,
    completed: false,
    won: false,
    lost: false,
    wrongGuesses: null,
    guessedCount: 0,
    hintUsed: false,
    perfect: false,
  };
}

function buildPlayers(compare: CompareResponse | null, metric: ChartMetric): ChartSeries[] {
  if (!compare) return [];

  return [compare.me, ...compare.follows].map((entry, index) => ({
    profileId: entry.profileId,
    label: entry.profileId === compare.me.profileId ? "You" : entry.displayName ?? `@${entry.handle}`,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    summary: entry.summary,
    daily: compare.axisDates.map((date) => {
      const day = entry.daily.find((item) => item.date === date) ?? emptyDay(date);

      return {
        date,
        attempted: day.attempted,
        completed: day.completed,
        won: day.won,
        lost: day.lost,
        wrongGuesses: day.wrongGuesses,
        guessedCount: day.guessedCount,
        hintUsed: day.hintUsed,
        perfect: day.perfect,
        value:
          metric === "wrongGuesses"
            ? day.wrongGuesses
            : day.attempted
              ? Math.max(day.guessedCount, 1)
              : null,
        highlight: metric === "wrongGuesses" && day.perfect,
        importedOn: day.importedOn ?? null,
        semantleRawText: day.semantleRawText ?? null,
        semantlePuzzleNumber: day.semantlePuzzleNumber ?? null,
        semantleTopGuessNumber: day.semantleTopGuessNumber ?? null,
        semantleTopScore: day.semantleTopScore ?? null,
        semantleHintsUsed: day.semantleHintsUsed ?? null,
        wordleRawText: day.wordleRawText ?? null,
        wordlePuzzleNumber: day.wordlePuzzleNumber ?? null,
        wordleAttempts: day.wordleAttempts ?? null,
        wordleMaxGuesses: day.wordleMaxGuesses ?? null,
      };
    }),
  }));
}

function formatShortDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getEasternDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function getLocalDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value ?? "0";
    return Number.parseInt(value, 10);
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = getTimeZoneParts(date, timeZone);
  const utcTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return utcTime - date.getTime();
}

function zonedDateTimeToUtc(dateKey: string, hour: number, minute: number, timeZone: string) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;

  const localAsUtc = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), hour, minute, 0);
  const firstGuess = new Date(localAsUtc);
  const firstOffset = getTimeZoneOffsetMs(timeZone, firstGuess);
  const secondGuess = new Date(localAsUtc - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(timeZone, secondGuess);

  return new Date(localAsUtc - secondOffset);
}

function formatLocalResetTime(dateKey: string, sourceTimeZone: string, hour: number, minute: number) {
  const resetAt = zonedDateTimeToUtc(dateKey, hour, minute, sourceTimeZone);
  if (!resetAt) return "Unknown";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(resetAt);
}

function getLocalTimeZoneName(now = new Date()) {
  const part = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    timeZoneName: "short",
  })
    .formatToParts(now)
    .find((value) => value.type === "timeZoneName")?.value;

  return part ?? "local time";
}

function formatWeekdayShort(date: string) {
  const parsed = parseDateKey(date);
  if (!parsed) return "";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function formatSocialDateOptionLabel(date: string, currentEasternDate: string) {
  const shortDate = formatShortDate(date);
  if (date === currentEasternDate) return `Today · ${shortDate}`;

  const weekday = formatWeekdayShort(date);
  return weekday ? `${weekday} · ${shortDate}` : shortDate;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map((v) => Number.parseInt(v, 10));
  if (!year || !month || !day) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function addDaysToDateKey(value: string, days: number) {
  const parsed = parseDateKey(value);
  if (!parsed) return "";
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return toDateKey(parsed);
}

function dayLabel(day: CompareDay | null, kind: GameKind) {
  if (!day) return "No data";
  if (!day.attempted) return "No attempt";
  if (!day.completed) return `In progress (${day.guessedCount})`;

  if (kind === "hangman") {
    if (day.won) {
      return day.perfect ? "Won · perfect" : `Won · ${day.wrongGuesses ?? 0} wrong`;
    }
    return `Lost · ${day.wrongGuesses ?? 0} wrong`;
  }

  if (kind === "semantle") {
    if (day.won) return `Solved · ${day.guessedCount} guesses`;
    return `Missed · ${day.guessedCount} guesses`;
  }

  if (day.won) return `Won in ${day.guessedCount}`;
  return `Lost in ${day.guessedCount}`;
}

function findFollowDay(compare: CompareResponse | null, profileId: string, date: string) {
  if (!compare) return null;
  const follow = compare.follows.find((f) => f.profileId === profileId);
  if (!follow) return null;
  return follow.daily.find((d) => d.date === date || d.importedOn === date) ?? null;
}

function getChartTickStep(maxValue: number) {
  if (maxValue <= 12) return 1;
  if (maxValue <= 30) return 5;
  if (maxValue <= 120) return 10;
  if (maxValue <= 300) return 25;
  return 50;
}

function getSemantleCurrentPuzzleKey(now = new Date()) {
  const diffDays = Math.floor((parseDateKey(getEasternDateKey(now))!.getTime() - SEMANTLE_BASE_DATE_UTC.getTime()) / (24 * 60 * 60 * 1000));
  return String(SEMANTLE_BASE_PUZZLE + diffDays);
}

function getWordleCurrentPuzzleKey(now = new Date()) {
  const diffDays = Math.floor((parseDateKey(getEasternDateKey(now))!.getTime() - WORDLE_BASE_DATE_UTC.getTime()) / (24 * 60 * 60 * 1000));
  return String(WORDLE_BASE_PUZZLE + diffDays);
}

function getSemantlePuzzleKeyForDate(date: string) {
  const parsed = parseDateKey(date);
  if (!parsed) return "";
  const diffDays = Math.floor((parsed.getTime() - SEMANTLE_BASE_DATE_UTC.getTime()) / (24 * 60 * 60 * 1000));
  return String(SEMANTLE_BASE_PUZZLE + diffDays);
}

function getWordlePuzzleKeyForDate(date: string) {
  const parsed = parseDateKey(date);
  if (!parsed) return "";
  const diffDays = Math.floor((parsed.getTime() - WORDLE_BASE_DATE_UTC.getTime()) / (24 * 60 * 60 * 1000));
  return String(WORDLE_BASE_PUZZLE + diffDays);
}

function formatSemantlePuzzleTick(value: string) {
  const puzzle = Number.parseInt(value, 10);
  if (!Number.isFinite(puzzle)) return value;
  return String(puzzle);
}

function formatWordlePuzzleTick(value: string) {
  const puzzle = Number.parseInt(value, 10);
  if (!Number.isFinite(puzzle)) return value;
  return String(puzzle);
}

function formatSemantleDetailText(day: ChartDay) {
  if (day.semantleRawText) return day.semantleRawText;

  const puzzle = day.semantlePuzzleNumber ?? Number.parseInt(day.date, 10);
  const solved = day.completed && day.value !== null;
  const guesses = day.value ?? 0;
  const topGuess = day.semantleTopGuessNumber ?? null;
  const topScore = day.semantleTopScore ?? null;
  const hints = day.semantleHintsUsed ?? 0;

  return [
    `Semantle #${Number.isFinite(puzzle) ? puzzle : day.date}`,
    `${solved ? "✅" : "❌"} ${guesses} Guesses`,
    `🔝 Guess #${topGuess ?? "—"}`,
    `🥈 ${topScore ?? "—"}/1000`,
    `💡 ${hints} Hints`,
    "semantle.com",
  ].join("\n");
}

function formatHangmanDetailText(day: ChartDay) {
  const status = day.completed ? (day.won ? "✅ Won" : day.lost ? "❌ Lost" : "Completed") : "🕓 In progress";
  const wrong = day.wrongGuesses ?? 0;
  const guesses = day.guessedCount;
  const hint = day.hintUsed ? "Yes" : "No";
  const perfect = day.perfect ? "Yes" : "No";

  return [
    `Hangman ${day.date}`,
    status,
    `❌ Wrong guesses: ${wrong}`,
    `🔤 Total guesses: ${guesses}`,
    `💡 Hint used: ${hint}`,
    `⭐ Perfect: ${perfect}`,
  ].join("\n");
}

function formatWordleDetailText(day: ChartDay) {
  if (day.wordleRawText) return day.wordleRawText;

  const puzzle = day.wordlePuzzleNumber ?? Number.parseInt(day.date, 10);
  const maxGuesses = day.wordleMaxGuesses ?? 6;
  const attempts = day.wordleAttempts;
  const score = day.completed ? `${attempts ?? day.guessedCount}/${maxGuesses}` : `X/${maxGuesses}`;

  return [
    `Wordle ${Number.isFinite(puzzle) ? puzzle : day.date} ${score}`,
    day.completed ? (day.won ? "✅ Solved" : "❌ Missed") : "🕓 In progress",
    `🔢 Guesses: ${day.guessedCount}`,
  ].join("\n");
}

function sanitizeWurpleGuesses(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
    .filter((item) => /^[0-9A-F]{6}$/.test(item));
}

function buildWurpleGuessBreakdown(seed: string, mode: "easy" | "challenge", guesses: string[]) {
  if (!seed || guesses.length === 0) return [];

  try {
    const cfg = mode === "challenge" ? games.wurple.MODE_CONFIG.challenge : games.wurple.MODE_CONFIG.easy;
    const state = games.wurple.createInitialState(seed, cfg);

    return guesses
      .map((guess) => {
        const feedback = games.wurple.getGuessFeedback(state.solution, guess, cfg);
        if (!feedback || !Array.isArray(feedback.tiles) || feedback.tiles.length === 0) return "";
        return feedback.tiles.map((t) => WURPLE_TILE_EMOJI[t] ?? "⬛").join("");
      })
      .filter((row) => row.length > 0);
  } catch {
    return [];
  }
}

function WurpleColorSwatch({ hex }: { hex: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const color = `#${hex}`;
    const size = canvas.width;
    const radius = size / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.stroke();
  }, [hex]);

  return <canvas ref={ref} width={26} height={26} className="h-[26px] w-[26px] rounded-full" aria-hidden />;
}

function buildLinePath(points: Array<{ x: number; y: number } | null>) {
  let path = "";
  let drawing = false;

  for (const point of points) {
    if (!point) {
      drawing = false;
      continue;
    }

    path += `${drawing ? "L" : "M"} ${point.x} ${point.y} `;
    drawing = true;
  }

  return path.trim();
}

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-300/70 bg-slate-100/70 p-4 dark:border-white/10 dark:bg-black/10">
      <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-text">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

function MetricLineChart({
  axisDates,
  players,
  emptyMessage,
  highlightLegend,
  yTickStepOverride,
  minYMax,
  xTickFormatter,
  variant,
  onPointSelect,
}: {
  axisDates: string[];
  players: ChartSeries[];
  emptyMessage: string;
  highlightLegend?: string;
  yTickStepOverride?: number;
  minYMax?: number;
  xTickFormatter?: (value: string) => string;
  variant: GameKind;
  onPointSelect?: (payload: { playerLabel: string; day: ChartDay; variant: GameKind; profileId: string }) => void;
}) {
  if (axisDates.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-300/70 bg-slate-100/70 px-4 py-8 text-center text-sm text-text-muted dark:border-white/10 dark:bg-black/10">
        {emptyMessage}
      </div>
    );
  }

  const width = 960;
  const height = 320;
  const margin = { top: 16, right: 20, bottom: 40, left: 40 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = players.flatMap((player) => player.daily.map((day) => day.value).filter((value): value is number => value !== null));
  const yMaxRaw = Math.max(6, values.length > 0 ? Math.max(...values) : 0);
  const yTickStep = yTickStepOverride ?? getChartTickStep(yMaxRaw);
  const yMax = Math.max(minYMax ?? 0, yTickStep, Math.ceil(yMaxRaw / yTickStep) * yTickStep);

  const xFor = (index: number) =>
    axisDates.length === 1 ? margin.left + plotWidth / 2 : margin.left + (index * plotWidth) / (axisDates.length - 1);
  const yFor = (value: number) => margin.top + plotHeight - (value / yMax) * plotHeight;

  const tickStep = Math.max(1, Math.ceil(axisDates.length / 6));
  const tickIndices = Array.from(
    new Set([0, ...axisDates.map((_, index) => index).filter((index) => index % tickStep === 0), axisDates.length - 1])
  ).sort((a, b) => a - b);

  return (
    <div className="mt-4 space-y-3">
      {/* Player selector pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {players.map((player) => (
          <div
            key={player.profileId}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-slate-100/80 px-3 py-1 text-text-muted dark:border-white/10 dark:bg-black/10"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.color }} />
            <span>{player.label}</span>
          </div>
        ))}
      </div>

      {/* Symbol legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
        <div className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-slate-500/50 bg-slate-500/40 dark:border-white/20 dark:bg-white/30" />
          <span>Completed</span>
        </div>

        {highlightLegend && (
          <div className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-slate-700 bg-slate-700 dark:border-white/40 dark:bg-white" />
            <span>{highlightLegend}</span>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 11 11" className="shrink-0">
            <line x1="2" y1="2" x2="9" y2="9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="9" y1="2" x2="2" y2="9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span>Started, not finished</span>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-text-muted/30">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--color-bg-panel)] to-transparent z-10" />
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full min-w-[720px]">
          {Array.from({ length: Math.floor(yMax / yTickStep) + 1 }, (_, index) => index * yTickStep).map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--color-text-muted)" strokeOpacity="0.25" strokeWidth="1" />
                <text x={margin.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="var(--color-text-muted)" fillOpacity="0.9">
                  {tick}
                </text>
              </g>
            );
          })}

          {tickIndices.map((index) => (
            <g key={axisDates[index]}>
              <line
                x1={xFor(index)}
                y1={margin.top}
                x2={xFor(index)}
                y2={height - margin.bottom}
                stroke="var(--color-text-muted)"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
              <text x={xFor(index)} y={height - 12} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)" fillOpacity="0.9">
                {(xTickFormatter ?? formatShortDate)(axisDates[index])}
              </text>
            </g>
          ))}

          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="var(--color-text)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />

          {players.map((player) => {
            const linePoints = player.daily.map((day, index) => (day.completed && day.value !== null ? { x: xFor(index), y: yFor(day.value) } : null));
            const path = buildLinePath(linePoints);

            return (
              <g key={player.profileId}>
                {path ? <path d={path} fill="none" stroke={player.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}

                {player.daily.map((day, index) => {
                  if (!day.completed || day.value === null) return null;

                  const x = xFor(index);
                  const y = yFor(day.value);

                  return (
                    <circle
                      key={`${player.profileId}-${day.date}-point`}
                      cx={x}
                      cy={y}
                      r={day.highlight ? 5 : 4}
                      fill={day.highlight ? "var(--color-text)" : player.color}
                      stroke={player.color}
                      strokeWidth="2"
                      className={variant === "semantle" || variant === "hangman" || variant === "wurple" || variant === "wordle" ? "cursor-pointer" : undefined}
                      onClick={
                        variant === "semantle" || variant === "hangman" || variant === "wurple" || variant === "wordle"
                          ? () => onPointSelect?.({ playerLabel: player.label, day, variant, profileId: player.profileId })
                          : undefined
                      }
                    />
                  );
                })}

                {player.daily.map((day, index) => {
                  if (!day.attempted || day.completed || day.value === null) return null;

                  const x = xFor(index);
                  const y = yFor(day.value);

                  return (
                    <g key={`${player.profileId}-${day.date}-x`} stroke={player.color} strokeWidth="2.5" strokeLinecap="round">
                      <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
                      <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        </div>
      </div>
    </div>
  );
}

function GameSummaryGrid({
  entry,
  availableDays,
  variant,
  isMe,
}: {
  entry: CompareEntry;
  availableDays: number;
  variant: GameKind;
  isMe: boolean;
}) {
  const s = entry.summary;
  const heading = isMe ? "Your summary" : (entry.displayName ?? `@${entry.handle}`);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-white">{heading}</h3>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Games played" value={s.totalPlayed} hint="Started with at least one guess." />
        <SummaryCard label="Games completed" value={s.totalCompleted} hint={`Out of ${availableDays} scheduled dailies in range.`} />

        {variant === "hangman" ? (
          <>
            <SummaryCard label="Perfect games" value={s.perfectCount} hint="Won with zero wrong guesses and no hint." />
            <SummaryCard label="Avg wrong guesses" value={s.avgWrongGuesses.toFixed(2)} hint="Across completed dailies." />
            <SummaryCard label="Win rate" value={formatPercent(s.winRate)} hint="Completed games won out of total completed." />
          </>
        ) : (
          <>
            <SummaryCard label="Wins" value={s.totalWon} hint={formatPercent(s.winRate)} />
            <SummaryCard label="Losses" value={s.totalLost} hint={`${availableDays - s.totalWon} possible scheduled misses in range.`} />
            <SummaryCard label="Avg guesses" value={s.avgGuesses.toFixed(2)} hint="Across completed dailies." />
          </>
        )}

        <SummaryCard label="Still in progress" value={s.attemptedNotCompletedDays} hint="Started but not finished yet." />
      </div>
    </div>
  );
}

function PlayerBreakdown({ players, variant }: { players: ChartSeries[]; variant: GameKind }) {
  if (players.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-text">Player breakdown</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {players.map((player) => (
          <div key={player.profileId} className="rounded-xl border border-slate-300/70 bg-slate-100/70 p-4 dark:border-white/10 dark:bg-black/10">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
              <div>
                <div className="text-sm font-semibold text-text">{player.label}</div>
                <div className="text-xs text-text-muted">
                  {player.summary.totalWon} wins · {player.summary.totalLost} losses · {formatPercent(player.summary.winRate)} win rate
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-text-muted">Played</dt>
                <dd className="font-semibold text-text">{player.summary.totalPlayed}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Completed</dt>
                <dd className="font-semibold text-text">{player.summary.totalCompleted}</dd>
              </div>

              {variant === "hangman" ? (
                <>
                  <div>
                    <dt className="text-text-muted">Avg wrong</dt>
                    <dd className="font-semibold text-text">{player.summary.avgWrongGuesses.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Perfect</dt>
                    <dd className="font-semibold text-text">{player.summary.perfectCount}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt className="text-text-muted">Wins</dt>
                    <dd className="font-semibold text-text">{player.summary.totalWon}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Losses</dt>
                    <dd className="font-semibold text-text">{player.summary.totalLost}</dd>
                  </div>
                </>
              )}

              {variant === "hangman" ? (
                <div>
                  <dt className="text-text-muted">Win rate</dt>
                  <dd className="font-semibold text-text">{formatPercent(player.summary.winRate)}</dd>
                </div>
              ) : (
                <div>
                  <dt className="text-text-muted">Avg guesses</dt>
                  <dd className="font-semibold text-text">{player.summary.avgGuesses.toFixed(2)}</dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted">In progress</dt>
                <dd className="font-semibold text-text">{player.summary.attemptedNotCompletedDays}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameSection({
  title,
  subtitle,
  compare,
  players,
  variant,
  emptyMessage,
  highlightLegend,
  yTickStep,
  minYMax,
  xTickFormatter,
  framed = true,
  onPointSelect,
}: {
  title: string;
  subtitle: string;
  compare: CompareResponse | null;
  players: ChartSeries[];
  variant: GameKind;
  emptyMessage: string;
  highlightLegend?: string;
  yTickStep?: number;
  minYMax?: number;
  xTickFormatter?: (value: string) => string;
  framed?: boolean;
  onPointSelect?: (payload: { playerLabel: string; day: ChartDay; variant: GameKind; profileId: string }) => void;
}) {
  if (!compare) return null;

  return (
    <section className={framed ? "rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5" : ""}>
      {/* <div>
        <h2 className="font-semibold">{title}</h2> */}
      {/* </div> */}

      <MetricLineChart
        axisDates={compare.axisDates}
        players={players}
        emptyMessage={emptyMessage}
        highlightLegend={highlightLegend}
        yTickStepOverride={yTickStep}
        minYMax={minYMax}
        xTickFormatter={xTickFormatter}
        variant={variant}
        onPointSelect={onPointSelect}
      />
    <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
     
      <PlayerBreakdown players={players} variant={variant} />
    </section>
  );
}

function TodayStatusCell({ day, kind }: { day: CompareDay | null; kind: GameKind }) {
  if (!day || !day.attempted) {
    return <span className="text-[11px] text-text-muted/40">—</span>;
  }

  if (!day.completed) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-600/30 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
        Playing…
      </span>
    );
  }

  if (day.won) {
    if (kind === "hangman" && day.perfect) {
      return (
        <span className="inline-flex items-center rounded-full border border-yellow-600/35 bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-900 dark:border-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-300">
          ★ Perfect
        </span>
      );
    }
    const label =
      kind === "hangman"
        ? `Won · ${day.wrongGuesses ?? 0}✗`
        : kind === "semantle"
          ? `Solved · ${day.guessedCount}`
          : `Won · ${day.guessedCount}`;
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-600/30 bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-300">
        {label}
      </span>
    );
  }

  const label =
    kind === "hangman"
      ? `Lost · ${day.wrongGuesses ?? 0}✗`
      : kind === "semantle"
        ? `Missed · ${day.guessedCount}`
        : `Lost · ${day.guessedCount}`;
  return (
    <span className="inline-flex items-center rounded-full border border-rose-600/35 bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-900 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
      {label}
    </span>
  );
}

function TodayGrid({ rows }: { rows: TodayRow[] }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <article
          key={row.profileId}
          className={[
            "rounded-lg border border-slate-300/70 bg-slate-100/70 p-3 dark:border-white/10 dark:bg-black/10",
            row.isMe ? "border-link/40 bg-link/5" : "",
          ].join(" ")}
        >
          <div className="mb-2 flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-text">{row.label}</span>
            {row.isMe ? (
              <span className="text-[10px] text-text-muted">you</span>
            ) : (
              <span className="text-[11px] text-text-muted">@{row.handle}</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Hangman</span>
              <TodayStatusCell day={row.hangmanDay} kind="hangman" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Wurple Easy</span>
              <TodayStatusCell day={row.wurpleEasyDay} kind="wurple" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Wurple Challenge</span>
              <TodayStatusCell day={row.wurpleChallengeDay} kind="wurple" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Semantle</span>
              <TodayStatusCell day={row.semantleDay} kind="semantle" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Wordle</span>
              <TodayStatusCell day={row.wordleDay} kind="wordle" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SocialPage() {
  const [followUrl, setFollowUrl] = useState("");
  const [followToken, setFollowToken] = useState("");
  const [followInput, setFollowInput] = useState("");
  const [profileHandle, setProfileHandle] = useState<string>("");
  const [profileDisplayName, setProfileDisplayName] = useState<string>("");
  const [profileInput, setProfileInput] = useState("");
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [status, setStatus] = useState<{ message: string; tone: "success" | "error" | "info" } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hangmanCompare, setHangmanCompare] = useState<CompareResponse | null>(null);
  const [wurpleEasyCompare, setWurpleEasyCompare] = useState<CompareResponse | null>(null);
  const [wurpleChallengeCompare, setWurpleChallengeCompare] = useState<CompareResponse | null>(null);
  const [semantleCompare, setSemantleCompare] = useState<CompareResponse | null>(null);
  const [wordleCompare, setWordleCompare] = useState<CompareResponse | null>(null);
  const [wurpleError, setWurpleError] = useState<string | null>(null);
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [followers, setFollowers] = useState<FollowItem[]>([]);
  const [blockedPlayers, setBlockedPlayers] = useState<BlockItem[]>([]);
  const [semantleText, setSemantleText] = useState("");
  const [isImportingSemantle, setIsImportingSemantle] = useState(false);
  const [wordleText, setWordleText] = useState("");
  const [isImportingWordle, setIsImportingWordle] = useState(false);
  const [range, setRange] = useState<"30d" | "90d" | "all">("30d");
  const [selectedSocialDate, setSelectedSocialDate] = useState(() => getEasternDateKey());
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [chartFromDate, setChartFromDate] = useState("");
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>("hangman");
  const [selectedDetailPoint, setSelectedDetailPoint] = useState<{
    title: string;
    playerLabel: string;
    detailText: string;
    variant: GameKind;
    wurpleGuesses?: string[];
    wurpleSeed?: string;
    wurpleMode?: "easy" | "challenge";
  } | null>(null);
  const [localWurpleGuessMap, setLocalWurpleGuessMap] = useState<Record<string, string[]>>({});
  const [didImportLocalWurple, setDidImportLocalWurple] = useState(false);

  const wurpleBreakdownRows = useMemo(() => {
    if (!selectedDetailPoint || selectedDetailPoint.variant !== "wurple") return [];
    if (!selectedDetailPoint.wurpleSeed || !selectedDetailPoint.wurpleMode) return [];

    return buildWurpleGuessBreakdown(
      selectedDetailPoint.wurpleSeed,
      selectedDetailPoint.wurpleMode,
      selectedDetailPoint.wurpleGuesses ?? []
    );
  }, [selectedDetailPoint]);

  const showStatus = (message: string, tone: "success" | "error" | "info" = "success") => {
    setStatus({ message, tone });
  };

  const clearStatus = () => {
    setStatus(null);
  };

  async function importLocalWurpleHistory() {
    if (didImportLocalWurple || typeof window === "undefined") return;

    const KEY_PREFIX = "playseed:wurple:";
    const completionLookup = new Map<string, string>();

    try {
      const localStatsRaw = window.localStorage.getItem("wurple:stats:v2");
      if (localStatsRaw) {
        const parsed = JSON.parse(localStatsRaw) as {
          statsByMode?: Record<string, { completed?: Record<string, { completedAt?: string }> }>;
        };

        for (const mode of ["easy", "challenge"] as const) {
          const completed = parsed?.statsByMode?.[mode]?.completed ?? {};
          for (const [seed, item] of Object.entries(completed)) {
            if (item?.completedAt) completionLookup.set(`${seed}:${mode}`, item.completedAt);
          }
        }
      }
    } catch {
      // ignore malformed local stats
    }

    const entries: Array<{
      seed: string;
      mode: "easy" | "challenge";
      status: "playing" | "won" | "lost";
      guessCount: number;
      completedAt: string | null;
    }> = [];
    const localGuessMap: Record<string, string[]> = {};

    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(KEY_PREFIX)) continue;

        const parts = key.split(":");
        if (parts.length < 4) continue;

        const mode = parts[2];
        if (mode !== "easy" && mode !== "challenge") continue;
        const seed = parts.slice(3).join(":");

        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw) as {
          seed?: string;
          mode?: "easy" | "challenge";
          guesses?: string[];
          status?: "playing" | "won" | "lost";
        };

        if (parsed.seed !== seed || parsed.mode !== mode) continue;
        if (parsed.status !== "playing" && parsed.status !== "won" && parsed.status !== "lost") continue;

        const guesses = sanitizeWurpleGuesses(parsed.guesses);
        const guessCount = guesses.length;

        localGuessMap[`${mode}:${seed}`] = guesses;

        entries.push({
          seed,
          mode,
          status: parsed.status,
          guessCount,
          completedAt: completionLookup.get(`${seed}:${mode}`) ?? null,
        });
      }
    } catch {
      // ignore localStorage errors
    }

    setLocalWurpleGuessMap(localGuessMap);

    if (entries.length === 0) {
      setDidImportLocalWurple(true);
      return;
    }

    try {
      const res = await fetch("/api/wurple/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        setDidImportLocalWurple(true);
      }
    } catch {
      // keep dashboard usable even if import fails
    }
  }

  async function loadAll(nextRange = range, nextChartFrom = chartFromDate) {
    try {
      setLoadError(null);
      setWurpleError(null);

      const pushLoadError = (message: string) => {
        setLoadError((current) => current ?? message);
      };

      const meRes = await fetch("/api/social/me", { cache: "no-store" });
      if (!meRes.ok) {
        setLoadError("Could not initialize your profile. Please refresh the page.");
        return;
      }

      const meData = await meRes.json();
      const meProfile = meData?.profile ?? {};
      const nextHandle = typeof meProfile.handle === "string" ? meProfile.handle : "";
      const nextDisplayName = typeof meProfile.displayName === "string" ? meProfile.displayName : "";

      setProfileHandle(nextHandle);
      setProfileDisplayName(nextDisplayName);
      setProfileInput((current) => {
        if (current.trim().length > 0 && current !== profileDisplayName) return current;
        return nextDisplayName;
      });

      await importLocalWurpleHistory();

      const compareParams = new URLSearchParams({ range: nextRange });
      if (nextChartFrom) {
        const nextChartTo = addDaysToDateKey(nextChartFrom, 29);
        compareParams.set("from", nextChartFrom);
        if (nextChartTo) compareParams.set("to", nextChartTo);
      }
      const compareQuery = compareParams.toString();

      const [linkRes, followsRes, hangmanRes, wurpleEasyRes, wurpleChallengeRes, semantleRes, wordleRes] = await Promise.all([
        fetch("/api/social/follow-link", { cache: "no-store" }),
        fetch("/api/social/follows", { cache: "no-store" }),
        fetch(`/api/social/compare/hangman?${compareQuery}`, { cache: "no-store" }),
        fetch(`/api/social/compare/wurple?${compareQuery}&mode=easy`, { cache: "no-store" }),
        fetch(`/api/social/compare/wurple?${compareQuery}&mode=challenge`, { cache: "no-store" }),
        fetch(`/api/social/compare/semantle?${compareQuery}`, { cache: "no-store" }),
        fetch(`/api/social/compare/wordle?${compareQuery}`, { cache: "no-store" }),
      ]);

      if (linkRes.ok) {
        const linkData = await linkRes.json();
        const token = typeof linkData.token === "string" ? linkData.token : "";
        const rawUrl = typeof linkData.followUrl === "string" ? linkData.followUrl : "";
        const fallbackUrl =
          token && typeof window !== "undefined"
            ? `${window.location.origin}/social?follow=${encodeURIComponent(token)}`
            : "";
        const url = rawUrl || fallbackUrl;

        setFollowToken(token);
        setFollowUrl(url);
        if (!url) pushLoadError("Follow link is not ready yet. Refresh and try again.");
      } else {
        setFollowUrl("");
        setFollowToken("");
        pushLoadError("Could not load your follow link.");
      }

      if (followsRes.ok) {
        const followsData = await followsRes.json();
        setFollows(followsData.follows ?? []);
        setFollowers(followsData.followers ?? []);
        setBlockedPlayers(followsData.blocked ?? []);
      } else {
        setFollows([]);
        setFollowers([]);
        setBlockedPlayers([]);
        pushLoadError("Could not load your follows list.");
      }

      if (hangmanRes.ok) {
        setHangmanCompare((await hangmanRes.json()) as CompareResponse);
      } else {
        setHangmanCompare(null);
        pushLoadError("Could not load your Hangman stats.");
      }

      const missingWurpleModes: string[] = [];

      if (wurpleEasyRes.ok) {
        setWurpleEasyCompare((await wurpleEasyRes.json()) as CompareResponse);
      } else {
        setWurpleEasyCompare(null);
        missingWurpleModes.push("easy");
      }

      if (wurpleChallengeRes.ok) {
        setWurpleChallengeCompare((await wurpleChallengeRes.json()) as CompareResponse);
      } else {
        setWurpleChallengeCompare(null);
        missingWurpleModes.push("challenge");
      }

      if (semantleRes.ok) {
        setSemantleCompare((await semantleRes.json()) as CompareResponse);
      } else {
        setSemantleCompare(null);
      }

      if (wordleRes.ok) {
        setWordleCompare((await wordleRes.json()) as CompareResponse);
      } else {
        setWordleCompare(null);
      }

      if (missingWurpleModes.length === 2) {
        setWurpleError("Wurple social stats are not available yet.");
      } else if (missingWurpleModes.length === 1) {
        setWurpleError(`Wurple ${missingWurpleModes[0]} mode is not available yet.`);
      }
    } catch {
      setLoadError("Could not load your social dashboard. Please refresh the page.");
      setFollows([]);
      setFollowers([]);
      setBlockedPlayers([]);
      setHangmanCompare(null);
      setWurpleEasyCompare(null);
      setWurpleChallengeCompare(null);
      setSemantleCompare(null);
      setWordleCompare(null);
    }
  }

  useEffect(() => {
    void loadAll(range, chartFromDate);
  }, [range, didImportLocalWurple, chartFromDate]);

  useEffect(() => {
    setSelectedDetailPoint(null);
  }, [activeChartTab, range, chartFromDate]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(null), 2600);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("follow");
    if (!token) return;

    (async () => {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) showStatus(data.alreadyFollowing ? "Already following." : "Now following!", data.alreadyFollowing ? "info" : "success");
      else showStatus(data.error ?? "Unable to follow", "error");

      params.delete("follow");
      const next = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${next ? `?${next}` : ""}`);

      await loadAll(range);
    })();
     
  }, []);

  const hangmanPlayers = useMemo(() => buildPlayers(hangmanCompare, "wrongGuesses").slice(0, MAX_CHART_PLAYERS), [hangmanCompare]);
  const wurpleEasyPlayers = useMemo(() => buildPlayers(wurpleEasyCompare, "guessedCount").slice(0, MAX_CHART_PLAYERS), [wurpleEasyCompare]);
  const wurpleChallengePlayers = useMemo(() => buildPlayers(wurpleChallengeCompare, "guessedCount").slice(0, MAX_CHART_PLAYERS), [wurpleChallengeCompare]);
  const semantlePlayers = useMemo(() => buildPlayers(semantleCompare, "guessedCount").slice(0, MAX_CHART_PLAYERS), [semantleCompare]);
  const wordlePlayers = useMemo(() => buildPlayers(wordleCompare, "guessedCount").slice(0, MAX_CHART_PLAYERS), [wordleCompare]);
  const currentEasternDate = useMemo(() => getEasternDateKey(), []);
  const localTimeZoneName = useMemo(() => getLocalTimeZoneName(), []);
  const socialDateOptions = useMemo(() => {
    const available = new Set<string>();

    for (const compare of [hangmanCompare, wurpleEasyCompare, wurpleChallengeCompare]) {
      for (const date of compare?.axisDates ?? []) {
        if (parseDateKey(date)) available.add(date);
      }
    }

    if (parseDateKey(currentEasternDate)) available.add(currentEasternDate);

    return Array.from(available).sort((a, b) => b.localeCompare(a));
  }, [currentEasternDate, hangmanCompare, wurpleEasyCompare, wurpleChallengeCompare]);
  const selectedSemantlePuzzleKey = useMemo(() => getSemantlePuzzleKeyForDate(selectedSocialDate), [selectedSocialDate]);
  const selectedWordlePuzzleKey = useMemo(() => getWordlePuzzleKeyForDate(selectedSocialDate), [selectedSocialDate]);
  const hangmanResetLabel = useMemo(() => formatLocalResetTime(selectedSocialDate, "UTC", 0, 0), [selectedSocialDate]);
  const wurpleResetLabel = useMemo(() => formatLocalResetTime(selectedSocialDate, "America/New_York", 0, 0), [selectedSocialDate]);
  const semantleResetLabel = useMemo(() => formatLocalResetTime(selectedSocialDate, "America/New_York", 20, 0), [selectedSocialDate]);
  const wordleResetLabel = useMemo(() => formatLocalResetTime(selectedSocialDate, "America/New_York", 0, 0), [selectedSocialDate]);

  useEffect(() => {
    if (socialDateOptions.length === 0) return;
    if (!socialDateOptions.includes(selectedSocialDate)) {
      setSelectedSocialDate(socialDateOptions.includes(currentEasternDate) ? currentEasternDate : socialDateOptions[0]);
    }
  }, [currentEasternDate, selectedSocialDate, socialDateOptions]);

  const chartRangeLabel = useMemo(() => {
    if (chartFromDate) return `${chartFromDate} → ${addDaysToDateKey(chartFromDate, 29)}`;
    return range.toUpperCase();
  }, [chartFromDate, range]);

  const followedTodayRows = useMemo(() => {
    return follows.map((follow) => ({
      follow,
      hangmanDay: findFollowDay(hangmanCompare, follow.profileId, selectedSocialDate),
      wurpleEasyDay: findFollowDay(wurpleEasyCompare, follow.profileId, selectedSocialDate),
      wurpleChallengeDay: findFollowDay(wurpleChallengeCompare, follow.profileId, selectedSocialDate),
      semantleDay: findFollowDay(semantleCompare, follow.profileId, selectedSemantlePuzzleKey),
      wordleDay: findFollowDay(wordleCompare, follow.profileId, selectedWordlePuzzleKey),
    }));
  }, [follows, hangmanCompare, wurpleEasyCompare, wurpleChallengeCompare, semantleCompare, wordleCompare, selectedSocialDate, selectedSemantlePuzzleKey, selectedWordlePuzzleKey]);

  const activeChart = useMemo(() => {
    if (activeChartTab === "hangman") {
      return {
        title: "Hangman",
        subtitle: "Daily wrong guesses per player. Lower is better. A white dot marks a perfect game.",
        compare: hangmanCompare,
        players: hangmanPlayers,
        hiddenPlayerCount: Math.max(0, (hangmanCompare?.follows.length ?? 0) + 1 - MAX_CHART_PLAYERS),
        variant: "hangman" as GameKind,
        emptyMessage: "No daily Hangman schedule exists yet for this range.",
        highlightLegend: "Perfect game",
        yTickStep: undefined,
        minYMax: undefined,
        xTickFormatter: undefined,
      };
    }

    if (activeChartTab === "wurpleEasy") {
      return {
        title: "Wurple · Easy",
        subtitle: "Daily guesses used in easy mode. Lower is better.",
        compare: wurpleEasyCompare,
        players: wurpleEasyPlayers,
        hiddenPlayerCount: Math.max(0, (wurpleEasyCompare?.follows.length ?? 0) + 1 - MAX_CHART_PLAYERS),
        variant: "wurple" as GameKind,
        emptyMessage: "No Wurple easy schedule exists yet for this range.",
        highlightLegend: undefined,
        yTickStep: undefined,
        minYMax: undefined,
        xTickFormatter: undefined,
      };
    }

    if (activeChartTab === "semantle") {
      return {
        title: "Semantle",
        subtitle: "Guesses per Semantle puzzle number. Lower is better.",
        compare: semantleCompare,
        players: semantlePlayers,
        hiddenPlayerCount: Math.max(0, (semantleCompare?.follows.length ?? 0) + 1 - MAX_CHART_PLAYERS),
        variant: "semantle" as GameKind,
        emptyMessage: "No Semantle results have been imported for this range yet.",
        highlightLegend: undefined,
        yTickStep: 10,
        minYMax: 300,
        xTickFormatter: formatSemantlePuzzleTick,
      };
    }

    if (activeChartTab === "wordle") {
      return {
        title: "Wordle",
        subtitle: "Guesses per Wordle puzzle number. Lower is better.",
        compare: wordleCompare,
        players: wordlePlayers,
        hiddenPlayerCount: Math.max(0, (wordleCompare?.follows.length ?? 0) + 1 - MAX_CHART_PLAYERS),
        variant: "wordle" as GameKind,
        emptyMessage: "No Wordle results have been imported for this range yet.",
        highlightLegend: undefined,
        yTickStep: 1,
        minYMax: 6,
        xTickFormatter: formatWordlePuzzleTick,
      };
    }

    return {
      title: "Wurple · Challenge",
      subtitle: "Daily guesses used in challenge mode. Lower is better.",
      compare: wurpleChallengeCompare,
      players: wurpleChallengePlayers,
      hiddenPlayerCount: Math.max(0, (wurpleChallengeCompare?.follows.length ?? 0) + 1 - MAX_CHART_PLAYERS),
      variant: "wurple" as GameKind,
      emptyMessage: "No Wurple challenge schedule exists yet for this range.",
      highlightLegend: undefined,
      yTickStep: undefined,
      minYMax: undefined,
      xTickFormatter: undefined,
    };
  }, [
    activeChartTab,
    hangmanCompare,
    hangmanPlayers,
    semantleCompare,
    semantlePlayers,
    wordleCompare,
    wordlePlayers,
    wurpleEasyCompare,
    wurpleEasyPlayers,
    wurpleChallengeCompare,
    wurpleChallengePlayers,
  ]);

  const myTodayRow = useMemo<TodayRow>(
    () => ({
      profileId: "__me__",
      label: profileDisplayName || `@${profileHandle || "you"}`,
      handle: profileHandle,
      isMe: true,
      hangmanDay: hangmanCompare?.me.daily.find((d) => d.date === selectedSocialDate) ?? null,
      wurpleEasyDay: wurpleEasyCompare?.me.daily.find((d) => d.date === selectedSocialDate) ?? null,
      wurpleChallengeDay: wurpleChallengeCompare?.me.daily.find((d) => d.date === selectedSocialDate) ?? null,
      semantleDay: semantleCompare?.me.daily.find((d) => d.date === selectedSemantlePuzzleKey || d.importedOn === selectedSocialDate) ?? null,
      wordleDay: wordleCompare?.me.daily.find((d) => d.date === selectedWordlePuzzleKey || d.importedOn === selectedSocialDate) ?? null,
    }),
    [hangmanCompare, wurpleEasyCompare, wurpleChallengeCompare, semantleCompare, wordleCompare, selectedSocialDate, selectedSemantlePuzzleKey, selectedWordlePuzzleKey, profileHandle, profileDisplayName]
  );

  const todayGridRows = useMemo<TodayRow[]>(
    () => [
      myTodayRow,
      ...followedTodayRows.map(({ follow, hangmanDay, wurpleEasyDay, wurpleChallengeDay, semantleDay, wordleDay }) => ({
        profileId: follow.profileId,
        label: follow.displayName ?? `@${follow.handle}`,
        handle: follow.handle,
        isMe: false,
        hangmanDay,
        wurpleEasyDay,
        wurpleChallengeDay,
        semantleDay,
        wordleDay,
      })),
    ],
    [myTodayRow, followedTodayRows]
  );

  async function copyFollowLink() {
    const fallbackUrl =
      followToken && typeof window !== "undefined"
        ? `${window.location.origin}/social?follow=${encodeURIComponent(followToken)}`
        : "";
    const rawFollowUrl = followUrl || fallbackUrl;
    const textToCopy = `Follow me on Decide~Learn~Do: ${rawFollowUrl}`;

    if (!rawFollowUrl) {
      setCopyFeedback("error");
      setTimeout(() => setCopyFeedback("idle"), 1600);
      showStatus("Follow link is not ready yet. Please refresh the page.", "error");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopyFeedback("success");
        setTimeout(() => setCopyFeedback("idle"), 1600);
        showStatus("Follow link copied!", "success");
        return;
      }
    } catch {
      // continue to legacy fallback
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(ta);

      if (copied) {
        setCopyFeedback("success");
        setTimeout(() => setCopyFeedback("idle"), 1600);
        showStatus("Follow link copied!", "success");
        return;
      }
    } catch {
      // ignore and show manual copy message below
    }

    setCopyFeedback("error");
    setTimeout(() => setCopyFeedback("idle"), 1600);
    showStatus("Could not copy link. Please try again.", "error");
  }

  async function followByHandleOrToken(e: React.FormEvent) {
    e.preventDefault();
    const raw = followInput.trim();
    if (!raw) return;

    let token: string | null = null;
    if (raw.includes("follow=")) {
      try {
        token = new URL(raw).searchParams.get("follow");
      } catch {
        token = null;
      }
    }
    const payload = token ? { token } : { handle: raw.replace(/^@/, "") };

    const res = await fetch("/api/social/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus(data.alreadyFollowing ? "Already following." : "Followed successfully!", data.alreadyFollowing ? "info" : "success");
      setFollowInput("");
      await loadAll(range);
    } else {
      if (data.error === "FOLLOW_BLOCKED") {
        showStatus("You can’t follow this player due to a block.", "error");
      } else {
        showStatus(data.error ?? "Could not follow that profile", "error");
      }
    }
  }

  async function unfollow(profileId: string) {
    const res = await fetch(`/api/social/follow/${profileId}`, { method: "DELETE" });
    if (res.ok) {
      await loadAll(range);
      showStatus("Unfollowed", "info");
    }
  }

  async function blockPlayer(profileId: string) {
    const res = await fetch("/api/social/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus(data.alreadyBlocked ? "Player is already blocked." : "Player blocked.", data.alreadyBlocked ? "info" : "success");
      await loadAll(range);
      return;
    }

    showStatus(data.error ?? "Could not block this player", "error");
  }

  async function unblockPlayer(profileId: string) {
    const res = await fetch(`/api/social/block/${profileId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showStatus("Player unblocked.", "success");
      await loadAll(range);
      return;
    }

    showStatus(data.error ?? "Could not unblock this player", "error");
  }

  async function importSemantleResult(e: React.FormEvent) {
    e.preventDefault();
    const text = semantleText.trim();
    if (!text) return;

    clearStatus();
    setIsImportingSemantle(true);
    try {
      const res = await fetch("/api/semantle/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "INVALID_SEMANTLE_RESULT") {
          showStatus("Could not parse that Semantle result. Paste the full shared block.", "error");
        } else {
          showStatus(data.error ?? "Could not import Semantle result", "error");
        }
        return;
      }

      setSemantleText("");
      await loadAll(range);
      showStatus(data.message ?? "Semantle result imported.", "success");
    } catch {
      showStatus("Could not import Semantle result. Please refresh and try again.", "error");
    } finally {
      setIsImportingSemantle(false);
    }
  }

  async function importWordleResult(e: React.FormEvent) {
    e.preventDefault();
    const text = wordleText.trim();
    if (!text) return;

    clearStatus();
    setIsImportingWordle(true);
    try {
      const res = await fetch("/api/wordle/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "INVALID_WORDLE_RESULT") {
          showStatus("Could not parse that Wordle result. Paste the full shared block.", "error");
        } else {
          showStatus(data.error ?? "Could not import Wordle result", "error");
        }
        return;
      }

      setWordleText("");
      await loadAll(range);
      showStatus(data.message ?? "Wordle result imported.", "success");
    } catch {
      showStatus("Could not import Wordle result. Please refresh and try again.", "error");
    } finally {
      setIsImportingWordle(false);
    }
  }

  async function saveProfileName(e: React.FormEvent) {
    e.preventDefault();
    const next = profileInput.trim();

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/social/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(data.error ?? "Could not save profile name", "error");
        return;
      }

      const savedName = typeof data?.profile?.displayName === "string" ? data.profile.displayName : "";
      const savedHandle = typeof data?.profile?.handle === "string" ? data.profile.handle : profileHandle;

      setProfileDisplayName(savedName);
      setProfileInput(savedName);
      setProfileHandle(savedHandle);
      setIsEditingProfileName(false);
      showStatus(savedName ? "Profile name saved" : "Profile name removed", "success");

      await loadAll(range);
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
      <header>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Social Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Compare daily performance across games with people you follow.
          </p>
        </div>
      </header>

      {loadError && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠️ {loadError}
        </div>
      )}

      <div className="text-sm font-bold uppercase tracking-[0.16em] text-text dark:text-white/85">Overview</div>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 space-y-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Profile</h2>
          <span className="text-xs text-text-muted">@{profileHandle || "player"}</span>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-text-muted">Display name:</div>
            <div className="text-sm font-semibold text-text">{profileDisplayName || `@${profileHandle || "player"}`}</div>

            <button
              type="button"
              aria-label="Edit display name"
              onClick={() => {
                setProfileInput(profileDisplayName);
                setIsEditingProfileName(true);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-sm text-text-muted transition hover:bg-slate-100 hover:text-text dark:border-white/15 dark:hover:bg-white/10"
            >
              ✎
            </button>

            <button
              type="button"
              onClick={copyFollowLink}
              disabled={!followUrl && !followToken}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-bold transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100",
                copyFeedback === "success"
                  ? "bg-emerald-600 text-white"
                  : copyFeedback === "error"
                    ? "bg-red-600 text-white"
                    : "bg-link text-white dark:text-slate-950",
              ].join(" ")}
            >
              {copyFeedback === "success" ? "Link copied!" : copyFeedback === "error" ? "Copy failed" : "Share follow link"}
            </button>
          </div>

          {isEditingProfileName ? (
            <form onSubmit={saveProfileName} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                placeholder={`Display name (or use @${profileHandle || "player"})`}
                className="w-full rounded-lg border border-slate-300 bg-bg px-3 py-2 text-sm dark:border-white/10"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-lg bg-link px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 dark:text-slate-950 sm:min-w-[92px]"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileInput(profileDisplayName);
                  setIsEditingProfileName(false);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-slate-100 hover:text-text dark:border-white/20 dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <div className="text-sm font-bold uppercase tracking-[0.16em] text-text dark:text-white/85">Activity</div>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 space-y-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Daily snapshot</h2>
            <p className="text-[11px] text-text-muted">Uses Eastern Time for date selection.</p>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-text-muted">
            <span>Date</span>
            <select
              value={selectedSocialDate}
              onChange={(e) => setSelectedSocialDate(e.target.value)}
              className="rounded border border-slate-300 bg-bg px-2 py-1 text-xs text-text dark:border-white/10"
            >
              {socialDateOptions.map((date) => (
                <option key={date} value={date}>
                  {formatSocialDateOptionLabel(date, currentEasternDate)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowResetInfo((current) => !current)}
              aria-expanded={showResetInfo}
              aria-label="Show game reset times"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-text-muted transition hover:bg-slate-100 hover:text-text dark:border-white/15 dark:hover:bg-white/10"
            >
              ?
            </button>
          </label>
        </div>

        {showResetInfo ? (
          <div className="rounded-lg border border-slate-300/70 bg-slate-100/70 p-3 text-xs text-text-muted dark:border-white/10 dark:bg-black/10">
            <div className="mb-2 font-semibold text-text">Game reset times in {localTimeZoneName}</div>
            <ul className="space-y-1.5">
              <li>
                <span className="font-medium text-text">Hangman:</span> {hangmanResetLabel}
              </li>
              <li>
                <span className="font-medium text-text">Wurple:</span> {wurpleResetLabel}
              </li>
              <li>
                <span className="font-medium text-text">Semantle:</span> {semantleResetLabel}
              </li>
              <li>
                <span className="font-medium text-text">Wordle:</span> {wordleResetLabel}
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-text-muted">
              These reset times are not all the same, so late-night results can fall under different game days.
            </p>
          </div>
        ) : null}

        <TodayGrid rows={todayGridRows} />

        {follows.length === 0 && (
          <p className="text-center text-xs text-text-muted">Follow players to compare your daily results.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 space-y-3 dark:border-white/10 dark:bg-white/5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">History charts</h2>
            <span className="text-xs text-text-muted">{chartRangeLabel}</span>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex items-center gap-2 text-[11px] text-text-muted">
              <span>Start</span>
              <input
                type="date"
                value={chartFromDate}
                onChange={(e) => setChartFromDate(e.target.value)}
                className="rounded border border-white/10 bg-bg px-2 py-1 text-xs"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setChartFromDate("");
              }}
              className="rounded border border-white/15 px-2 py-1 text-xs text-text-muted transition hover:bg-bg-soft hover:text-text"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "hangman", label: "Hangman" },
              { id: "wurpleEasy", label: "Wurple Easy" },
              { id: "wurpleChallenge", label: "Wurple Challenge" },
              { id: "semantle", label: "Semantle" },
              { id: "wordle", label: "Wordle" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartTab(tab.id as ChartTab)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold transition hover:brightness-110",
                  activeChartTab === tab.id
                    ? "bg-link text-white ring-1 ring-black/15 dark:text-slate-950 dark:ring-white/20"
                    : "bg-bg-soft text-text-muted hover:text-text",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(activeChartTab === "semantle" || activeChartTab === "wordle") && (
            <p className="text-xs text-text-muted">** Use the Imports section below to add new results for this tab. **</p>
          )}

          {wurpleError && activeChartTab !== "hangman" && (
            <p className="mt-3 text-xs text-amber-300">⚠️ {wurpleError}</p>
          )}

          {activeChart.hiddenPlayerCount > 0 && (
            <p className="text-xs text-text-muted">
              Showing {MAX_CHART_PLAYERS} players at a time ({activeChart.hiddenPlayerCount} hidden).
            </p>
          )}
        </div>

        <GameSection
          title={activeChart.title}
          subtitle={activeChart.subtitle}
          compare={activeChart.compare}
          players={activeChart.players}
          variant={activeChart.variant}
          emptyMessage={activeChart.emptyMessage}
          highlightLegend={activeChart.highlightLegend}
          yTickStep={activeChart.yTickStep}
          minYMax={activeChart.minYMax}
          xTickFormatter={activeChart.xTickFormatter}
          framed={false}
          onPointSelect={({ playerLabel, day, variant, profileId }) => {
            if (variant === "semantle") {
              setSelectedDetailPoint({
                title: "Semantle result details",
                playerLabel,
                detailText: formatSemantleDetailText(day),
                variant,
              });
              return;
            }

            if (variant === "hangman") {
              setSelectedDetailPoint({
                title: "Hangman result details",
                playerLabel,
                detailText: formatHangmanDetailText(day),
                variant,
              });
              return;
            }

            if (variant === "wurple") {
              const isMe = profileId === activeChart.compare?.me.profileId;
              const mode = activeChartTab === "wurpleChallenge" ? "challenge" : "easy";
              const wurpleGuesses = isMe ? (localWurpleGuessMap[`${mode}:${day.date}`] ?? []) : [];

              setSelectedDetailPoint({
                title: `Wurple ${mode === "easy" ? "Easy" : "Challenge"} details`,
                playerLabel,
                detailText: [
                  `Wurple ${day.date}`,
                  `${day.completed ? (day.won ? "✅ Won" : "❌ Lost") : "🕓 In progress"}`,
                  `🔢 Guesses: ${day.guessedCount}`,
                ].join("\n"),
                variant,
                wurpleGuesses,
                wurpleSeed: day.date,
                wurpleMode: mode,
              });
              return;
            }

            if (variant === "wordle") {
              setSelectedDetailPoint({
                title: "Wordle result details",
                playerLabel,
                detailText: formatWordleDetailText(day),
                variant,
              });
            }
          }}
        />

        {activeChart.compare?.isCapped && (
          <p className="text-xs text-amber-300">
            Showing the most recent {activeChart.compare.maxLookbackDays ?? 365} days.
          </p>
        )}

        {!activeChart.compare && (
          <div className="border border-dashed border-slate-300/70 bg-slate-100/70 px-4 py-8 text-center text-sm text-text-muted dark:border-white/10 dark:bg-black/10">
            No stats are available for this tab yet.
          </div>
        )}
      </section>

      <div className="text-sm font-bold uppercase tracking-[0.16em] text-text dark:text-white/85">Imports</div>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 space-y-3 dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-semibold">Import Semantle score</div>
            <div className="text-xs text-text-muted">
              Paste your shared Semantle result block and we&apos;ll save it to your profile.
            </div>

            <form onSubmit={importSemantleResult} className="space-y-2.5">
              <textarea
                value={semantleText}
                onChange={(e) => setSemantleText(e.target.value)}
                placeholder={"Semantle #1209\n✅ 200 Guesses\n🔝 Guess #199\n🥈 983/1000\n💡 0 Hints\nsemantle.com"}
                className="min-h-28 w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isImportingSemantle || semantleText.trim().length === 0}
                  className="rounded-lg bg-link px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 dark:text-slate-950"
                >
                  {isImportingSemantle ? "Importing..." : "Import score"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Import Wordle score</div>
            <div className="text-xs text-text-muted">
              Paste your shared Wordle result block and we&apos;ll save it to your profile.
            </div>

            <form onSubmit={importWordleResult} className="space-y-2.5">
              <textarea
                value={wordleText}
                onChange={(e) => setWordleText(e.target.value)}
                placeholder={"Wordle 1,737 3/6\n⬛🟨⬛⬛⬛\n🟩🟨⬛🟨⬛\n🟩🟩🟩🟩🟩"}
                className="min-h-28 w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isImportingWordle || wordleText.trim().length === 0}
                  className="rounded-lg bg-link px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 dark:text-slate-950"
                >
                  {isImportingWordle ? "Importing..." : "Import score"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="text-sm font-bold uppercase tracking-[0.16em] text-text dark:text-white/85">Social connections</div>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 space-y-2 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold">Follow people</h2>
        <form onSubmit={followByHandleOrToken} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={followInput}
            onChange={(e) => setFollowInput(e.target.value)}
            placeholder="@handle or follow link"
            className="w-full rounded-lg border border-slate-300 bg-bg px-3 py-2 text-sm dark:border-white/10"
          />
          <button type="submit" className="rounded-lg bg-easy px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 sm:min-w-[96px]">
            Follow
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Following ({follows.length})</h2>
            <div className="mt-1 text-xs text-text-muted">
              Manage who you&apos;re following and see their game results.
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {follows.length === 0 && <p className="text-sm text-text-muted">You are not following anyone yet.</p>}
          {follows.map((f) => (
            <div key={f.profileId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-300/70 px-3 py-2 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void blockPlayer(f.profileId)}
                  className="text-xs rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300 transition hover:bg-red-500/20"
                >
                  Block
                </button>
                <button
                  type="button"
                  onClick={() => void unfollow(f.profileId)}
                  className="text-xs rounded-md border border-white/20 px-2 py-1 transition hover:bg-bg-soft"
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Followers ({followers.length})</h2>
            <div className="mt-1 text-xs text-text-muted">
              Players who follow your profile.
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {followers.length === 0 && <p className="text-sm text-text-muted">No one follows you yet.</p>}
          {followers.map((f) => (
            <div key={f.profileId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-300/70 px-3 py-2 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => void blockPlayer(f.profileId)}
                className="shrink-0 text-xs rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300 transition hover:bg-red-500/20"
              >
                Block
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-300/70 bg-slate-50/80 p-4 md:p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Blocked ({blockedPlayers.length})</h2>
            <div className="mt-1 text-xs text-text-muted">
              Blocked players can&apos;t follow you and won&apos;t appear in compare stats.
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {blockedPlayers.length === 0 && <p className="text-sm text-text-muted">You have not blocked anyone.</p>}
          {blockedPlayers.map((f) => (
            <div key={f.profileId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-300/70 px-3 py-2 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => void unblockPlayer(f.profileId)}
                className="shrink-0 text-xs rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300 transition hover:bg-emerald-500/20"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedDetailPoint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedDetailPoint(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-300/80 bg-bg-panel p-4 shadow-2xl dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedDetailPoint.title}</h3>
                <p className="mt-1 text-xs text-text-muted">{selectedDetailPoint.playerLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailPoint(null)}
                className="rounded border border-white/15 px-2 py-1 text-xs text-text-muted transition hover:bg-bg-soft hover:text-text"
              >
                Close
              </button>
            </div>

            <pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-300/70 bg-slate-100 p-3 text-xs leading-5 text-text dark:border-white/10 dark:bg-slate-900/95 dark:text-white">
              {selectedDetailPoint.detailText}
            </pre>

            {selectedDetailPoint.variant === "wurple" && (
              <div className="mt-3 rounded-lg border border-slate-300/70 bg-slate-100 p-3 dark:border-white/10 dark:bg-slate-900/95">
                {wurpleBreakdownRows.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Guess breakdown</div>
                    <pre className="whitespace-pre-wrap rounded-lg border border-slate-300/70 bg-slate-50 p-2 text-sm leading-5 text-text dark:border-white/10 dark:bg-black/20 dark:text-white">
                      {wurpleBreakdownRows.join("\n")}
                    </pre>
                  </div>
                )}

                {selectedDetailPoint.wurpleSeed && selectedDetailPoint.wurpleMode && (
                  <div className="mb-3">
                    <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Answer</div>
                    <img
                      alt="Wurple answer color"
                      src={`/api/wurple/target?seed=${encodeURIComponent(selectedDetailPoint.wurpleSeed)}&mode=${selectedDetailPoint.wurpleMode}`}
                      className="h-14 w-full max-w-[220px] rounded-lg border border-white/20 object-cover"
                      draggable={false}
                    />
                  </div>
                )}

                <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Chosen colors</div>
                {selectedDetailPoint.wurpleGuesses && selectedDetailPoint.wurpleGuesses.length > 0 ? (
                  <div className="flex flex-wrap gap-2" onContextMenu={(e) => e.preventDefault()}>
                    {selectedDetailPoint.wurpleGuesses.map((hex, index) => (
                      <div key={`${hex}-${index}`} className="inline-flex items-center rounded-full border border-slate-300/70 bg-slate-50 p-1 dark:border-white/10 dark:bg-black/20">
                        <WurpleColorSwatch hex={hex} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-text-muted">Color swatches are available for your locally saved Wurple runs.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {status && (
        <div
          className={[
            "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-sm shadow-lg",
            status.tone === "error"
              ? "border border-red-500/40 bg-red-600/90 text-white"
              : status.tone === "info"
                ? "border border-white/20 bg-black/80 text-white"
                : "border border-emerald-500/40 bg-emerald-600/90 text-white",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </div>
      )}
    </main>
  );
}
