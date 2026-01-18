"use client";

import * as React from "react";
import { computeHangmanStats, loadHangmanRecords } from "../helpers/hangmanStats";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
};

export function HangmanStatsModal({ open, onClose, title = "Stats" }: Props) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [version, setVersion] = React.useState(0);

  // Refresh stats whenever modal opens (and if we want, after new results)
  React.useEffect(() => {
    if (open) setVersion((v) => v + 1);
  }, [open]);

  // ESC close
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus
  React.useEffect(() => {
    if (open) window.setTimeout(() => panelRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const records = loadHangmanRecords();
  const stats = computeHangmanStats(records);

  const maxDist = Math.max(
    1,
    ...Object.values(stats.distribution),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close stats"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "relative w-full sm:max-w-lg",
          "rounded-2xl",
          "bg-bg-panel border border-white/10 shadow-2xl",
          "p-5 sm:p-6"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white/90">{title}</h2>
            <p className="mt-1 text-sm text-white/60">
              Your Hangman performance (stored on this device).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-white/80 hover:bg-white/10 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard label="Played" value={stats.played} />
          <StatCard label="Win rate" value={`${stats.winRate}%`} />
          <StatCard label="Current streak" value={stats.currentStreak} />
          <StatCard label="Max streak" value={stats.maxStreak} />
        </div>

        {/* Hint usage */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/85">Hints used</div>
            <div className="text-sm text-white/80">
              {stats.hintUsedCount}
              <span className="text-white/50"> / {stats.played}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/55">
            (Counts completed puzzles where you revealed the hint.)
          </div>
        </div>

        {/* Distribution */}
        <div className="mt-5">
          <div className="flex items-end justify-between">
            <h3 className="text-sm font-bold text-white/85">Mistakes distribution</h3>
            <div className="text-xs text-white/50">0 → {stats.maxWrong}</div>
          </div>

          <div className="mt-3 space-y-2">
            {Array.from({ length: stats.maxWrong + 1 }).map((_, i) => {
              const count = stats.distribution[i] ?? 0;
              const w = Math.round((count / maxDist) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 text-xs text-white/60">{i}</div>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/10">
                    <div
                      className="h-full bg-white/30 transition-all"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-xs text-white/70">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
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

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-white/90">{value}</div>
    </div>
  );
}
