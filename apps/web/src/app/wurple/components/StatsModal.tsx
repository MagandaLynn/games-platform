"use client";

import { useEffect, useId, useMemo } from "react";
import type { WurpleStats } from "../helpers/statsStore";

type Mode = "easy" | "challenge";

type Props = {
  open: boolean;
  onClose: () => void;
  stats: WurpleStats;
  mode: Mode;
  onModeChange: (m: Mode) => void;
};

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}

export default function StatsModal({
  open,
  onClose,
  stats,
  mode,
  onModeChange,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const computed = useMemo(() => {
    const modeStats = stats?.statsByMode?.[mode];
    if (!modeStats) return null;

    const totalPlayed = modeStats.totalPlayed ?? 0;
    const totalWins = modeStats.totalWins ?? 0;
    const losses = Math.max(0, totalPlayed - totalWins);
    const winRate = pct(totalWins, totalPlayed);

    // const max = typeof maxGuesses === "number" ? maxGuesses : 10;
    const max = mode === "easy" ? 6 : 10;

    const rows = Array.from({ length: max }, (_, i) => {
    const guess = i + 1;
    const count = modeStats.winGuessCounts?.[String(guess)] ?? 0;
    return { guess, count };
    });

    if (mode === "challenge") {
    const overflow = Object.entries(modeStats.winGuessCounts ?? {})
        .filter(([g]) => Number(g) > max)
        .reduce((sum, [, c]) => sum + c, 0);

    rows.push({ guess: max+1 +"+", count: overflow } as any);
    }


    const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0);

    const rowsWithWidth = rows.map((r) => ({
      ...r,
      widthPct: maxCount ? Math.round((r.count / maxCount) * 100) : 0,
    }));

    return { modeStats, totalPlayed, totalWins, losses, winRate, rows: rowsWithWidth };
  }, [stats, mode]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-md rounded-2xl bg-bg-panel text-text shadow-xl ring-1 ring-black/10 dark:ring-white/10">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-extrabold">
              Your stats
            </h2>

            <div className="mt-3 inline-flex rounded-xl bg-bg-soft p-1">
              {(["easy", "challenge"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange(m)}
                  className={[
                    "px-3 py-1.5 text-sm font-semibold rounded-lg transition",
                    m === mode ? "bg-link text-white" : "text-text hover:opacity-80",
                  ].join(" ")}
                >
                  {m === "easy" ? "Easy" : "Challenge"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-bg-soft px-3 py-2 text-sm font-semibold text-text hover:opacity-90 transition"
            aria-label="Close stats"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          {!computed ? (
            <div className="text-sm text-text-muted">Loading…</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <StatBox label="Played" value={computed.totalPlayed} />
                <StatBox label="Win %" value={computed.winRate} />
                <StatBox label="Streak" value={computed.modeStats.currentStreak ?? 0} />
                <StatBox label="Best" value={computed.modeStats.bestStreak ?? 0} />
              </div>

              <div className="rounded-xl bg-bg-soft p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Guess Distribution
                </div>

                <div className="mt-3 space-y-2">
                  {computed.rows.map((row) => (
                    <div key={row.guess} className="flex items-center gap-2">
                      <div className="w-5 text-right text-xs font-semibold text-text-muted">
                        {row.guess}
                      </div>

                      <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-black/10 dark:bg-white/10">
                        <div
                          className="h-full rounded-lg bg-link/70"
                          style={{ width: `${row.widthPct}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-semibold text-text">
                          {row.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-text-muted">
                  Wins: {computed.totalWins} • Losses: {computed.losses}
                </div>
              </div>

              <div className="text-xs text-text-muted">
                Last updated:{" "}
                {stats.updatedAt ? new Date(stats.updatedAt).toLocaleString() : "—"}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-black/10 px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-link px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-bg-soft p-3 text-center">
      <div className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}
