"use client";

import { useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isAfter } from "date-fns";
import { useRouter } from "next/navigation";

type ArchiveMeta = {
  date: string;
  category?: string | null;
  hint?: string | null;
};

type Props = {
  archiveByDate: Record<string, ArchiveMeta>;
  initialDateKey: string;
  minDateKey: string;
  maxDateKey: string;
};

function toDateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(year, month - 1, day);
}

export default function HangmanArchiveCalendar({
  archiveByDate,
  initialDateKey,
  minDateKey,
  maxDateKey,
}: Props) {
  const router = useRouter();
  const availableDateKeys = useMemo(() => new Set(Object.keys(archiveByDate)), [archiveByDate]);
  const minDate = useMemo(() => parseDateKey(minDateKey), [minDateKey]);
  const maxDate = useMemo(() => parseDateKey(maxDateKey), [maxDateKey]);
  const [selectedDate, setSelectedDate] = useState<Date>(parseDateKey(initialDateKey));

  const selectedKey = toDateKey(selectedDate);
  const selectedMeta = archiveByDate[selectedKey] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
      <div className="space-y-1">
        <h2 className="m-0 text-lg font-bold text-text">Archive Calendar</h2>
        <div className="text-xs text-text-muted">
          Available daily puzzles can be selected. Unavailable dates are blocked out.
        </div>
      </div>

      <div className="rounded-2xl bg-bg-panel p-3 shadow-sm ring-1 ring-black/10">
        <DatePicker
          selected={selectedDate}
          onChange={(d: Date | null) => {
            if (!d) return;
            const key = toDateKey(d);
            if (!availableDateKeys.has(key)) return;
            setSelectedDate(d);
          }}
          inline
          minDate={minDate}
          maxDate={maxDate}
          filterDate={(date) => availableDateKeys.has(toDateKey(date))}
          showPopperArrow={false}
          dayClassName={(date) => {
            const key = toDateKey(date);
            const classes = ["hangman-archive-day"];

            if (key === selectedKey) classes.push("hangman-archive-selected");
            if (!availableDateKeys.has(key)) classes.push("hangman-archive-unavailable");
            if (isAfter(date, maxDate)) classes.push("hangman-archive-future");

            return classes.join(" ");
          }}
        />
      </div>

      <div className="w-full rounded-2xl bg-bg-panel p-4 text-text shadow-sm ring-1 ring-black/10">
        <div className="text-base font-extrabold">{selectedKey}</div>

        {selectedMeta ? (
          <>
            <div className="mt-3 space-y-1 text-sm text-text-muted">
              <div>
                <span className="font-semibold text-text">Category:</span>{" "}
                {selectedMeta.category?.trim() || "Uncategorized"}
              </div>
              {selectedMeta.hint ? (
                <div>
                  <span className="font-semibold text-text">Hint:</span> {selectedMeta.hint}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/hangman/archive/${selectedKey}`)}
                className="rounded-lg bg-link px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Play this Hangman
              </button>

              <button
                type="button"
                onClick={() => router.push("/hangman/daily")}
                className="rounded-lg bg-bg-soft px-4 py-2 text-sm font-semibold text-text transition hover:opacity-90"
              >
                Go to Today
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 text-sm text-text-muted">No puzzle is available for this date.</div>
        )}
      </div>

      <style jsx global>{`
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
          opacity: 0.3;
          cursor: not-allowed;
        }

        .hangman-archive-day {
          border-radius: 10px !important;
          position: relative;
        }

        .hangman-archive-day:not(.hangman-archive-unavailable)::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          left: 50%;
          transform: translateX(-50%);
          bottom: 1px;
          background: var(--color-link);
          opacity: 0.9;
        }

        .hangman-archive-unavailable {
          opacity: 0.22;
          text-decoration: line-through;
        }

        .hangman-archive-selected {
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.22) inset;
        }

        .hangman-archive-future {
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}