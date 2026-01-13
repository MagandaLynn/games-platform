"use client";

import React, { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfYear, isAfter } from "date-fns";
import { useRouter } from "next/navigation";

type Mode = "easy" | "challenge";

/**
 * What the calendar needs per date.
 * - easyCompleted/challengeCompleted: show SOLID dots
 * - easyInProgress/challengeInProgress: show HOLLOW dots (only when not completed)
 */
type ArchiveMeta = {
  easyCompleted?: boolean;
  challengeCompleted?: boolean;

  easyInProgress?: boolean;
  challengeInProgress?: boolean;

  // Optional extras (for the detail panel)
  easyGuessesCount?: number;
  challengeGuessesCount?: number;
  easyStatus?: "playing" | "won" | "lost" | string;
  challengeStatus?: "playing" | "won" | "lost" | string;
};

type Props = {
  archiveByDate: Record<string, ArchiveMeta>;
  onSelectDate?: (dateKey: string) => void;
};

function toDateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function WurpleArchiveCalendar({ archiveByDate, onSelectDate }: Props) {
  const router = useRouter();

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const yearStart = useMemo(() => startOfYear(new Date(2026, 0, 1)), []);

  const [selectedDate, setSelectedDate] = useState<Date>(yesterday);
  const selectedKey = toDateKey(selectedDate);
  const selectedMeta = archiveByDate[selectedKey];

  const easyDone = !!selectedMeta?.easyCompleted;
  const challengeDone = !!selectedMeta?.challengeCompleted;

  const easyInProgress = !!selectedMeta?.easyInProgress && !easyDone;
  const challengeInProgress = !!selectedMeta?.challengeInProgress && !challengeDone;

  function play(dateKey: string, mode: Mode) {
    router.push(`/wurple/archive/${dateKey}?mode=${mode}`);
  }

  // Precompute sets for quick dayClassName checks
  const sets = useMemo(() => {
    const easyOnly = new Set<string>();
    const challengeOnly = new Set<string>();
    const both = new Set<string>();

    const easyProg = new Set<string>();
    const challengeProg = new Set<string>();
    const bothProg = new Set<string>();

    for (const [dateKey, meta] of Object.entries(archiveByDate)) {
      const eDone = !!meta.easyCompleted;
      const cDone = !!meta.challengeCompleted;

      const eProg = !!meta.easyInProgress && !eDone;
      const cProg = !!meta.challengeInProgress && !cDone;

      // Completed sets
      if (eDone && cDone) both.add(dateKey);
      else if (eDone) easyOnly.add(dateKey);
      else if (cDone) challengeOnly.add(dateKey);

      // Progress sets (only show progress where not completed)
      if (eProg && cProg) bothProg.add(dateKey);
      else if (eProg) easyProg.add(dateKey);
      else if (cProg) challengeProg.add(dateKey);
    }

    return { easyOnly, challengeOnly, both, easyProg, challengeProg, bothProg };
  }, [archiveByDate]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="m-0 text-lg font-bold text-text">Wurple Archive</h2>
        <div className="text-xs text-text-muted">
          Markers: left = Easy, right = Challenge. Solid = completed, hollow = in progress.
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl bg-bg-panel p-3 shadow-sm ring-1 ring-black/10">
        <DatePicker
          selected={selectedDate}
          onChange={(d: Date | null) => {
            if (!d) return;
            setSelectedDate(d);
            onSelectDate?.(toDateKey(d));
          }}
          allowSameDay={false}
          inline
          openToDate={yearStart}
          minDate={yearStart}
          maxDate={yesterday}
          showPopperArrow={false}
          dayClassName={(date) => {
            const key = toDateKey(date);
            const classes: string[] = ["wurps-day"];

            // Completed markers first (solid)
            if (sets.both.has(key)) classes.push("wurps-both");
            else if (sets.easyOnly.has(key)) classes.push("wurps-easy");
            else if (sets.challengeOnly.has(key)) classes.push("wurps-challenge");
            // Otherwise show progress markers (hollow)
            else if (sets.bothProg.has(key)) classes.push("wurps-both-progress");
            else if (sets.easyProg.has(key)) classes.push("wurps-easy-progress");
            else if (sets.challengeProg.has(key)) classes.push("wurps-challenge-progress");

            if (key === selectedKey) classes.push("wurps-selected");
            if (isAfter(date, yesterday)) classes.push("wurps-future");

            return classes.join(" ");
          }}
        />
      </div>

      {/* Details panel */}
      <div className="w-full rounded-2xl bg-bg-panel p-4 text-text shadow-sm ring-1 ring-black/10">
        <div className="text-base font-extrabold">{selectedKey}</div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => play(selectedKey, "easy")}
            className="rounded-lg bg-easy px-4 py-2 text-sm font-semibold text-white hover:bg-easy-hover transition"
          >
            {easyDone ? "View Solved (Easy)" : easyInProgress ? "Continue Easy" : "Play Easy"}
          </button>

          <button
            type="button"
            onClick={() => play(selectedKey, "challenge")}
            className="rounded-lg bg-challenge px-4 py-2 text-sm font-semibold text-white hover:bg-challenge-hover transition"
          >
            {challengeDone ? "View Solved (Challenge)" : challengeInProgress ? "Continue Challenge" : "Play Challenge"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/wurple")}
            className="rounded-lg bg-bg-soft px-4 py-2 text-sm font-semibold text-text hover:opacity-90 transition"
          >
            Go to Today
          </button>
        </div>

        {(easyDone || challengeDone || easyInProgress || challengeInProgress) && (
          <div className="mt-4 grid gap-2 text-sm text-text-muted">
            {easyDone && (
              <div className="text-text">
                ✅ Easy
                {typeof selectedMeta?.easyGuessesCount === "number" ? ` • ${selectedMeta.easyGuessesCount} guesses` : ""}
              </div>
            )}
            {challengeDone && (
              <div className="text-text">
                ✅ Challenge
                {typeof selectedMeta?.challengeGuessesCount === "number"
                  ? ` • ${selectedMeta.challengeGuessesCount} guesses`
                  : ""}
              </div>
            )}
            {!easyDone && easyInProgress && <div>⏳ Easy in progress</div>}
            {!challengeDone && challengeInProgress && <div>⏳ Challenge in progress</div>}
          </div>
        )}
      </div>

      {/* Calendar theming + dots (global because react-datepicker ships global classnames) */}
      <style jsx global>{`
        /* Make the widget match our theme tokens */
        
        .react-datepicker {
          width: fit-content;
          border-radius: 14px;
          overflow: hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
          background: var(--color-bg-panel);
          color: var(--color-text);
          border: 1px solid rgba(0, 0, 0, 0.12);
          font-size: 1rem; 
        }

        .react-datepicker__day,
        .react-datepicker__day-name {
            width: 2.4rem;
            line-height: 2.4rem;
        }

        .react-datepicker__header {
          background: var(--color-bg-panel);
          padding-top: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--color-text);
        }

        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker__day {
          color: var(--color-text);
        }

        .react-datepicker__day:hover {
          background: var(--color-bg-soft);
          border-radius: 10px;
        }

        .react-datepicker__day--disabled {
          opacity: 0.35;
        }

        .react-datepicker__month-container {
          width: fit-content;
        }

        .react-datepicker__time-container {
          display: none;
        }

        .wurps-day {
          border-radius: 10px !important;
          position: relative;
        }

        /* Use theme tokens for marker colors */
        :root {
          --wurps-easy: var(--color-easy);
          --wurps-challenge: var(--color-challenge);
        }

        /* SOLID markers (completed) */

        .wurps-easy::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          left: 4px;
          bottom: 1px;
          background: var(--wurps-easy);
          opacity: 0.95;
        }

        .wurps-challenge::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          right: 4px;
          bottom: 1px;
          background: var(--wurps-challenge);
          opacity: 0.95;
        }

        .wurps-both::before,
        .wurps-both::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          bottom: 1px;
          opacity: 0.95;
        }
        .wurps-both::before {
          background: var(--wurps-easy);
          left: 4px;
        }
        .wurps-both::after {
          background: var(--wurps-challenge);
          right: 4px;
        }

        /* HOLLOW markers (in progress) */

        .wurps-easy-progress::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          left: 4px;
          bottom: 1px;
          border: 2px solid var(--wurps-easy);
          background: transparent;
          opacity: 0.6;
          box-sizing: border-box;
        }

        .wurps-challenge-progress::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          right: 4px;
          bottom: 1px;
          border: 2px solid var(--wurps-challenge);
          background: transparent;
          opacity: 0.6;
          box-sizing: border-box;
        }

        .wurps-both-progress::before,
        .wurps-both-progress::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          bottom: 1px;
          background: transparent;
          opacity: 0.6;
          box-sizing: border-box;
        }
        .wurps-both-progress::before {
          left: 4px;
          border: 2px solid var(--wurps-easy);
        }
        .wurps-both-progress::after {
          right: 4px;
          border: 2px solid var(--wurps-challenge);
        }

        /* Selected date emphasis */
        .wurps-selected {
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.22) inset;
        }

        /* Guard */
        .wurps-future {
          opacity: 0.4;
        }

        /* Dark mode: improve borders slightly (react-datepicker uses light borders by default) */
        .dark .react-datepicker {
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .dark .react-datepicker__header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .dark .wurps-selected {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.18) inset;
        }
      `}</style>
    </div>
  );
}
