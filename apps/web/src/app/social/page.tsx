"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PLAYER_COLORS = ["#60a5fa", "#f97316", "#a78bfa", "#34d399", "#facc15", "#f472b6", "#22d3ee"];

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
  availableDays: number;
  axisDates: string[];
  me: CompareEntry;
  follows: CompareEntry[];
};

type GameKind = "hangman" | "wurple";
type ChartMetric = "wrongGuesses" | "guessedCount";
type ChartTab = "hangman" | "wurpleEasy" | "wurpleChallenge";

type ChartDay = {
  date: string;
  attempted: boolean;
  completed: boolean;
  value: number | null;
  highlight: boolean;
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
};

function emptyDay(date: string): CompareDay {
  return {
    date,
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
        value:
          metric === "wrongGuesses"
            ? day.wrongGuesses
            : day.attempted
              ? Math.max(day.guessedCount, 1)
              : null,
        highlight: metric === "wrongGuesses" && day.perfect,
      };
    }),
  }));
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
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

  if (day.won) return `Won in ${day.guessedCount}`;
  return `Lost in ${day.guessedCount}`;
}

function findFollowDay(compare: CompareResponse | null, profileId: string, date: string) {
  if (!compare) return null;
  const follow = compare.follows.find((f) => f.profileId === profileId);
  if (!follow) return null;
  return follow.daily.find((d) => d.date === date) ?? null;
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
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

function MetricLineChart({
  axisDates,
  players,
  emptyMessage,
  highlightLegend,
}: {
  axisDates: string[];
  players: ChartSeries[];
  emptyMessage: string;
  highlightLegend?: string;
}) {
  if (axisDates.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-text-muted">
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
  const yMax = Math.max(6, values.length > 0 ? Math.max(...values) : 0);

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
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1 text-text-muted"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.color }} />
            <span>{player.label}</span>
          </div>
        ))}
      </div>

      {/* Symbol legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
        <div className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-white/20 bg-white/30" />
          <span>Completed</span>
        </div>

        {highlightLegend && (
          <div className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-white/40 bg-white" />
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

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full min-w-[720px]">
          {Array.from({ length: yMax + 1 }, (_, tick) => tick).map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x={margin.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.55)">
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
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <text x={xFor(index)} y={height - 12} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.55)">
                {formatShortDate(axisDates[index])}
              </text>
            </g>
          ))}

          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="rgba(255,255,255,0.14)"
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
                      fill={day.highlight ? "white" : player.color}
                      stroke={player.color}
                      strokeWidth="2"
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
      <h3 className="text-sm font-semibold text-white">Player breakdown</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {players.map((player) => (
          <div key={player.profileId} className="rounded-xl border border-white/10 bg-black/10 p-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
              <div>
                <div className="text-sm font-semibold text-white">{player.label}</div>
                <div className="text-xs text-text-muted">
                  {player.summary.totalWon} wins · {player.summary.totalLost} losses · {formatPercent(player.summary.winRate)} win rate
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-text-muted">Played</dt>
                <dd className="font-semibold text-white">{player.summary.totalPlayed}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Completed</dt>
                <dd className="font-semibold text-white">{player.summary.totalCompleted}</dd>
              </div>

              {variant === "hangman" ? (
                <>
                  <div>
                    <dt className="text-text-muted">Avg wrong</dt>
                    <dd className="font-semibold text-white">{player.summary.avgWrongGuesses.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Perfect</dt>
                    <dd className="font-semibold text-white">{player.summary.perfectCount}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt className="text-text-muted">Wins</dt>
                    <dd className="font-semibold text-white">{player.summary.totalWon}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Losses</dt>
                    <dd className="font-semibold text-white">{player.summary.totalLost}</dd>
                  </div>
                </>
              )}

              {variant === "hangman" ? (
                <div>
                  <dt className="text-text-muted">Win rate</dt>
                  <dd className="font-semibold text-white">{formatPercent(player.summary.winRate)}</dd>
                </div>
              ) : (
                <div>
                  <dt className="text-text-muted">Avg guesses</dt>
                  <dd className="font-semibold text-white">{player.summary.avgGuesses.toFixed(2)}</dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted">In progress</dt>
                <dd className="font-semibold text-white">{player.summary.attemptedNotCompletedDays}</dd>
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
}: {
  title: string;
  subtitle: string;
  compare: CompareResponse | null;
  players: ChartSeries[];
  variant: GameKind;
  emptyMessage: string;
  highlightLegend?: string;
}) {
  if (!compare) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
      </div>

      <MetricLineChart
        axisDates={compare.axisDates}
        players={players}
        emptyMessage={emptyMessage}
        highlightLegend={highlightLegend}
      />

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
      <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
        Playing…
      </span>
    );
  }

  if (day.won) {
    if (kind === "hangman" && day.perfect) {
      return (
        <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-300">
          ★ Perfect
        </span>
      );
    }
    const label =
      kind === "hangman" ? `Won · ${day.wrongGuesses ?? 0}✗` : `Won · ${day.guessedCount}`;
    return (
      <span className="inline-flex items-center rounded-full border border-green-500/25 bg-green-500/10 px-2 py-0.5 text-[11px] text-green-300">
        {label}
      </span>
    );
  }

  const label =
    kind === "hangman" ? `Lost · ${day.wrongGuesses ?? 0}✗` : `Lost · ${day.guessedCount}`;
  return (
    <span className="inline-flex items-center rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400">
      {label}
    </span>
  );
}

function TodayGrid({ rows }: { rows: TodayRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-[140px] pb-2.5 pr-4 text-left text-[11px] font-normal uppercase tracking-wide text-text-muted">
              Player
            </th>
            <th className="pb-2.5 px-3 text-left text-[11px] font-normal uppercase tracking-wide text-text-muted">
              Hangman
            </th>
            <th className="pb-2.5 px-3 text-left text-[11px] font-normal uppercase tracking-wide text-text-muted">
              Wurple Easy
            </th>
            <th className="pb-2.5 pl-3 text-left text-[11px] font-normal uppercase tracking-wide text-text-muted">
              Wurple Challenge
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.profileId}
              className={[
                "border-t border-white/[0.06]",
                row.isMe ? "bg-link/5" : "",
              ].join(" ")}
            >
              <td className="py-2.5 pr-4 align-middle">
                <div className="flex items-baseline gap-1.5">
                  <span className="max-w-[120px] truncate text-sm font-semibold leading-tight text-white">
                    {row.label}
                  </span>
                  {row.isMe && (
                    <span className="shrink-0 text-[10px] text-text-muted">you</span>
                  )}
                </div>
                {!row.isMe && (
                  <div className="text-[11px] text-text-muted">@{row.handle}</div>
                )}
              </td>
              <td className="py-2.5 px-3 align-middle">
                <TodayStatusCell day={row.hangmanDay} kind="hangman" />
              </td>
              <td className="py-2.5 px-3 align-middle">
                <TodayStatusCell day={row.wurpleEasyDay} kind="wurple" />
              </td>
              <td className="py-2.5 pl-3 align-middle">
                <TodayStatusCell day={row.wurpleChallengeDay} kind="wurple" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SocialPage() {
  const [followUrl, setFollowUrl] = useState("");
  const [followToken, setFollowToken] = useState("");
  const followUrlInputRef = useRef<HTMLInputElement | null>(null);
  const [followInput, setFollowInput] = useState("");
  const [profileHandle, setProfileHandle] = useState<string>("");
  const [profileDisplayName, setProfileDisplayName] = useState<string>("");
  const [profileInput, setProfileInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "success" | "error">("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hangmanCompare, setHangmanCompare] = useState<CompareResponse | null>(null);
  const [wurpleEasyCompare, setWurpleEasyCompare] = useState<CompareResponse | null>(null);
  const [wurpleChallengeCompare, setWurpleChallengeCompare] = useState<CompareResponse | null>(null);
  const [wurpleError, setWurpleError] = useState<string | null>(null);
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [followers, setFollowers] = useState<FollowItem[]>([]);
  const [blockedPlayers, setBlockedPlayers] = useState<BlockItem[]>([]);
  const [range, setRange] = useState<"30d" | "90d" | "all">("30d");
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>("hangman");
  const [didImportLocalWurple, setDidImportLocalWurple] = useState(false);

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

        const guessCount = Array.isArray(parsed.guesses) ? parsed.guesses.length : 0;

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

  async function loadAll(nextRange = range) {
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

      const [linkRes, followsRes, hangmanRes, wurpleEasyRes, wurpleChallengeRes] = await Promise.all([
        fetch("/api/social/follow-link", { cache: "no-store" }),
        fetch("/api/social/follows", { cache: "no-store" }),
        fetch(`/api/social/compare/hangman?range=${nextRange}`, { cache: "no-store" }),
        fetch(`/api/social/compare/wurple?range=${nextRange}&mode=easy`, { cache: "no-store" }),
        fetch(`/api/social/compare/wurple?range=${nextRange}&mode=challenge`, { cache: "no-store" }),
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
    }
  }

  useEffect(() => {
    void loadAll(range);
  }, [range, didImportLocalWurple]);

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
      if (res.ok) setStatus(data.alreadyFollowing ? "Already following." : "Now following!");
      else setStatus(data.error ?? "Unable to follow");

      params.delete("follow");
      const next = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${next ? `?${next}` : ""}`);

      await loadAll(range);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hangmanPlayers = useMemo(() => buildPlayers(hangmanCompare, "wrongGuesses"), [hangmanCompare]);
  const wurpleEasyPlayers = useMemo(() => buildPlayers(wurpleEasyCompare, "guessedCount"), [wurpleEasyCompare]);
  const wurpleChallengePlayers = useMemo(() => buildPlayers(wurpleChallengeCompare, "guessedCount"), [wurpleChallengeCompare]);

  const todayKey = useMemo(() => {
    const key = hangmanCompare?.to ?? wurpleEasyCompare?.to ?? wurpleChallengeCompare?.to;
    if (typeof key === "string" && key.length > 0) return key;
    return toDateKey(new Date());
  }, [hangmanCompare?.to, wurpleEasyCompare?.to, wurpleChallengeCompare?.to]);

  const followedTodayRows = useMemo(() => {
    return follows.map((follow) => ({
      follow,
      hangmanDay: findFollowDay(hangmanCompare, follow.profileId, todayKey),
      wurpleEasyDay: findFollowDay(wurpleEasyCompare, follow.profileId, todayKey),
      wurpleChallengeDay: findFollowDay(wurpleChallengeCompare, follow.profileId, todayKey),
    }));
  }, [follows, hangmanCompare, wurpleEasyCompare, wurpleChallengeCompare, todayKey]);

  const activeChart = useMemo(() => {
    if (activeChartTab === "hangman") {
      return {
        title: "Hangman",
        subtitle: "Daily wrong guesses per player. Lower is better. A white dot marks a perfect game.",
        compare: hangmanCompare,
        players: hangmanPlayers,
        variant: "hangman" as GameKind,
        emptyMessage: "No daily Hangman schedule exists yet for this range.",
        highlightLegend: "Perfect game",
      };
    }

    if (activeChartTab === "wurpleEasy") {
      return {
        title: "Wurple · Easy",
        subtitle: "Daily guesses used in easy mode. Lower is better.",
        compare: wurpleEasyCompare,
        players: wurpleEasyPlayers,
        variant: "wurple" as GameKind,
        emptyMessage: "No Wurple easy schedule exists yet for this range.",
        highlightLegend: undefined,
      };
    }

    return {
      title: "Wurple · Challenge",
      subtitle: "Daily guesses used in challenge mode. Lower is better.",
      compare: wurpleChallengeCompare,
      players: wurpleChallengePlayers,
      variant: "wurple" as GameKind,
      emptyMessage: "No Wurple challenge schedule exists yet for this range.",
      highlightLegend: undefined,
    };
  }, [
    activeChartTab,
    hangmanCompare,
    hangmanPlayers,
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
      hangmanDay: hangmanCompare?.me.daily.find((d) => d.date === todayKey) ?? null,
      wurpleEasyDay: wurpleEasyCompare?.me.daily.find((d) => d.date === todayKey) ?? null,
      wurpleChallengeDay: wurpleChallengeCompare?.me.daily.find((d) => d.date === todayKey) ?? null,
    }),
    [hangmanCompare, wurpleEasyCompare, wurpleChallengeCompare, todayKey, profileHandle, profileDisplayName]
  );

  const todayGridRows = useMemo<TodayRow[]>(
    () => [
      myTodayRow,
      ...followedTodayRows.map(({ follow, hangmanDay, wurpleEasyDay, wurpleChallengeDay }) => ({
        profileId: follow.profileId,
        label: follow.displayName ?? `@${follow.handle}`,
        handle: follow.handle,
        isMe: false,
        hangmanDay,
        wurpleEasyDay,
        wurpleChallengeDay,
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
      setStatus("Follow link is not ready yet. Please refresh the page.");
      return;
    }

    try {
      const input = followUrlInputRef.current;
      if (input) {
        input.focus();
        input.select();
        input.setSelectionRange(0, input.value.length);
      }

      const copied = document.execCommand("copy");
      if (copied) {
        setCopyFeedback("success");
        setTimeout(() => setCopyFeedback("idle"), 1600);
        setStatus("Follow link copied!");
        return;
      }
    } catch {
      // continue to modern clipboard fallback
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopyFeedback("success");
        setTimeout(() => setCopyFeedback("idle"), 1600);
        setStatus("Follow link copied!");
        return;
      }
    } catch {
      // ignore and show manual copy message below
    }

    setCopyFeedback("error");
    setTimeout(() => setCopyFeedback("idle"), 1600);
    setStatus("Could not copy link. Please select the field and copy manually.");
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
      setStatus(data.alreadyFollowing ? "Already following." : "Followed successfully!");
      setFollowInput("");
      await loadAll(range);
    } else {
      if (data.error === "FOLLOW_BLOCKED") {
        setStatus("You can’t follow this player due to a block.");
      } else {
        setStatus(data.error ?? "Could not follow that profile");
      }
    }
  }

  async function unfollow(profileId: string) {
    const res = await fetch(`/api/social/follow/${profileId}`, { method: "DELETE" });
    if (res.ok) {
      await loadAll(range);
      setStatus("Unfollowed");
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
      setStatus(data.alreadyBlocked ? "Player is already blocked." : "Player blocked.");
      await loadAll(range);
      return;
    }

    setStatus(data.error ?? "Could not block this player");
  }

  async function unblockPlayer(profileId: string) {
    const res = await fetch(`/api/social/block/${profileId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setStatus("Player unblocked.");
      await loadAll(range);
      return;
    }

    setStatus(data.error ?? "Could not unblock this player");
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
        setStatus(data.error ?? "Could not save profile name");
        return;
      }

      const savedName = typeof data?.profile?.displayName === "string" ? data.profile.displayName : "";
      const savedHandle = typeof data?.profile?.handle === "string" ? data.profile.handle : profileHandle;

      setProfileDisplayName(savedName);
      setProfileInput(savedName);
      setProfileHandle(savedHandle);
      setStatus(savedName ? "Profile name saved" : "Profile name removed");

      await loadAll(range);
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Social Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Compare daily performance across games with people you follow.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as "30d" | "90d" | "all")}
            className="rounded border border-white/10 bg-bg px-2 py-1 text-sm"
          >
            <option value="30d">Last 30d</option>
            <option value="90d">Last 90d</option>
            <option value="all">All</option>
          </select>
        </label>
      </header>

      {loadError && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠️ {loadError}
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Profile & share</h2>
          <span className="text-xs text-text-muted">@{profileHandle || "player"}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2.5">
            <div className="text-sm font-semibold">Display name</div>
            <div className="text-xs text-text-muted">
              This name appears in social compare views.
            </div>
            <div className="text-xs text-text-muted">
              Your handle: <span className="font-semibold text-white">@{profileHandle || "player"}</span>
            </div>
            <form onSubmit={saveProfileName} className="flex gap-2">
              <input
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                placeholder={`Display name (or use @${profileHandle || "player"})`}
                className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-lg bg-link px-4 py-2 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>
            </form>
            {profileDisplayName && (
              <div className="text-xs text-text-muted">
                Current name: <span className="font-semibold text-white">{profileDisplayName}</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <div className="text-sm font-semibold">Share follow link</div>
            <div className="text-xs text-text-muted">
              Anyone with this link can follow your profile.
            </div>
            <div className="flex gap-2">
              <input
                ref={followUrlInputRef}
                readOnly
                value={followUrl}
                className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={copyFollowLink}
                disabled={!followUrl && !followToken}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed",
                  copyFeedback === "success" ? "bg-emerald-600" : copyFeedback === "error" ? "bg-red-600" : "bg-link",
                ].join(" ")}
              >
                {copyFeedback === "success" ? "Copied!" : copyFeedback === "error" ? "Copy failed" : "Copy"}
              </button>
            </div>
            <div className="text-[11px] text-text-muted">
              {copyFeedback === "success"
                ? "✓ Copied to clipboard"
                : copyFeedback === "error"
                  ? "Copy was blocked — select the link field and press ⌘C"
                  : ""}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Today</h2>
          <div className="text-xs text-text-muted">{todayKey}</div>
        </div>

        <TodayGrid rows={todayGridRows} />

        {follows.length === 0 && (
          <p className="text-center text-xs text-text-muted">Follow players to compare your daily results.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">History charts</h2>
            <span className="text-xs text-text-muted">{range.toUpperCase()}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "hangman", label: "Hangman" },
              { id: "wurpleEasy", label: "Wurple Easy" },
              { id: "wurpleChallenge", label: "Wurple Challenge" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartTab(tab.id as ChartTab)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  activeChartTab === tab.id ? "bg-link text-white" : "bg-bg-soft text-text-muted hover:text-text",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {wurpleError && activeChartTab !== "hangman" && (
            <p className="mt-3 text-xs text-amber-300">⚠️ {wurpleError}</p>
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
        />

        {!activeChart.compare && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-text-muted">
            No stats are available for this tab yet.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 space-y-3">
        <div className="text-sm font-semibold">Follow someone</div>
        <form onSubmit={followByHandleOrToken} className="flex gap-2">
          <input
            value={followInput}
            onChange={(e) => setFollowInput(e.target.value)}
            placeholder="@handle or follow link"
            className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-easy px-4 py-2 text-sm font-bold text-white">
            Follow
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
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
            <div key={f.profileId} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-1.5">
              <div>
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void blockPlayer(f.profileId)}
                  className="text-xs rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300"
                >
                  Block
                </button>
                <button
                  type="button"
                  onClick={() => void unfollow(f.profileId)}
                  className="text-xs rounded-md border border-white/20 px-2 py-1"
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
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
            <div key={f.profileId} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-1.5">
              <div>
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => void blockPlayer(f.profileId)}
                className="text-xs rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300"
              >
                Block
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
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
            <div key={f.profileId} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-1.5">
              <div>
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => void unblockPlayer(f.profileId)}
                className="text-xs rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      </section>

      {status && <p className="text-sm text-emerald-400">{status}</p>}
    </main>
  );
}
