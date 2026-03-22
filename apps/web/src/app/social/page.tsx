"use client";

import { useEffect, useMemo, useState } from "react";

const PLAYER_COLORS = ["#60a5fa", "#f97316", "#a78bfa", "#34d399", "#facc15", "#f472b6", "#22d3ee"];

type FollowItem = {
  profileId: string;
  handle: string;
  displayName: string | null;
  followedAt: string;
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
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
        {players.map((player) => (
          <div key={player.profileId} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: player.color }} />
            <span>{player.label}</span>
          </div>
        ))}

        {highlightLegend && (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full border border-white/20 bg-white" />
            <span>{highlightLegend}</span>
          </div>
        )}

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1">
          <span className="font-semibold text-white">×</span>
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

function GameSummaryGrid({ compare, variant }: { compare: CompareResponse; variant: GameKind }) {
  const me = compare.me;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-white">Your summary</h3>

      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Games played" value={me.summary.totalPlayed} hint="Started with at least one guess." />
        <SummaryCard label="Games completed" value={me.summary.totalCompleted} hint={`Out of ${compare.availableDays} scheduled dailies in range.`} />

        {variant === "hangman" ? (
          <>
            <SummaryCard label="Perfect games" value={me.summary.perfectCount} hint="Won with zero wrong guesses and no hint." />
            <SummaryCard label="Avg wrong guesses" value={me.summary.avgWrongGuesses.toFixed(2)} hint="Across completed dailies." />
            <SummaryCard label="Avg total guesses" value={me.summary.avgGuesses.toFixed(2)} hint="Distinct letters guessed in completed dailies." />
          </>
        ) : (
          <>
            <SummaryCard label="Wins" value={me.summary.totalWon} hint={formatPercent(me.summary.winRate)} />
            <SummaryCard label="Losses" value={me.summary.totalLost} hint={`${compare.availableDays - me.summary.totalWon} possible scheduled misses in range.`} />
            <SummaryCard label="Avg guesses" value={me.summary.avgGuesses.toFixed(2)} hint="Across completed dailies." />
          </>
        )}

        <SummaryCard label="Still in progress" value={me.summary.attemptedNotCompletedDays} hint="Started but not finished yet." />
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

              <div>
                <dt className="text-text-muted">Avg guesses</dt>
                <dd className="font-semibold text-white">{player.summary.avgGuesses.toFixed(2)}</dd>
              </div>
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

      <GameSummaryGrid compare={compare} variant={variant} />
      <PlayerBreakdown players={players} variant={variant} />
    </section>
  );
}

export default function SocialPage() {
  const [followUrl, setFollowUrl] = useState("");
  const [followInput, setFollowInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hangmanCompare, setHangmanCompare] = useState<CompareResponse | null>(null);
  const [wurpleEasyCompare, setWurpleEasyCompare] = useState<CompareResponse | null>(null);
  const [wurpleChallengeCompare, setWurpleChallengeCompare] = useState<CompareResponse | null>(null);
  const [wurpleError, setWurpleError] = useState<string | null>(null);
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [range, setRange] = useState<"30d" | "90d" | "all">("30d");
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
        const url = linkData.followUrl ?? "";
        setFollowUrl(url);
        if (!url) pushLoadError("Follow link is not ready yet. Refresh and try again.");
      } else {
        setFollowUrl("");
        pushLoadError("Could not load your follow link.");
      }

      if (followsRes.ok) {
        const followsData = await followsRes.json();
        setFollows(followsData.follows ?? []);
      } else {
        setFollows([]);
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

  async function copyFollowLink() {
    if (!followUrl) return;
    await navigator.clipboard.writeText(`Follow my game results: ${followUrl}`);
    setStatus("Follow link copied!");
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
      setStatus(data.error ?? "Could not follow that profile");
    }
  }

  async function unfollow(profileId: string) {
    const res = await fetch(`/api/social/follow/${profileId}`, { method: "DELETE" });
    if (res.ok) {
      await loadAll(range);
      setStatus("Unfollowed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Social Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            One page for shared results across games. Hangman tracks wrong guesses; Wurple tracks guesses used for easy and challenge mode.
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

      <GameSection
        title="Hangman"
        subtitle="Daily wrong guesses per player. Lower is better. A white dot marks a perfect game."
        compare={hangmanCompare}
        players={hangmanPlayers}
        variant="hangman"
        emptyMessage="No daily Hangman schedule exists yet for this range."
        highlightLegend="Perfect game"
      />

      <section className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold">Wurple</h2>
          <p className="mt-1 text-xs text-text-muted">
            Two mode dashboard on one page. Each chart shows guesses used per daily puzzle.
          </p>
          {wurpleError && <p className="mt-2 text-xs text-amber-300">⚠️ {wurpleError}</p>}
        </div>

        <GameSection
          title="Wurple · Easy"
          subtitle="Daily guesses used in easy mode. Lower is better."
          compare={wurpleEasyCompare}
          players={wurpleEasyPlayers}
          variant="wurple"
          emptyMessage="No Wurple easy schedule exists yet for this range."
        />

        <GameSection
          title="Wurple · Challenge"
          subtitle="Daily guesses used in challenge mode. Lower is better."
          compare={wurpleChallengeCompare}
          players={wurpleChallengePlayers}
          variant="wurple"
          emptyMessage="No Wurple challenge schedule exists yet for this range."
        />

        {!wurpleEasyCompare && !wurpleChallengeCompare && !wurpleError && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-text-muted">
            Wurple stats have not been published for this range yet.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm font-semibold">Follow me link</div>
        <div className="flex gap-2">
          <input
            readOnly
            value={followUrl}
            className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={copyFollowLink}
            disabled={!followUrl}
            className="rounded-lg bg-link px-4 py-2 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Copy
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
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

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
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
            <div key={f.profileId} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
              <div>
                <div className="text-sm font-semibold">{f.displayName ?? `@${f.handle}`}</div>
                <div className="text-xs text-text-muted">@{f.handle}</div>
              </div>
              <button
                type="button"
                onClick={() => void unfollow(f.profileId)}
                className="text-xs rounded-md border border-white/20 px-2 py-1"
              >
                Unfollow
              </button>
            </div>
          ))}
        </div>
      </section>

      {status && <p className="text-sm text-emerald-400">{status}</p>}
    </main>
  );
}
