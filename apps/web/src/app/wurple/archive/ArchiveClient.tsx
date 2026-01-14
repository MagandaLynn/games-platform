"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WurpleArchiveCalendar from "./WurpleArchiveCalendar";
import { useWurpleArchive } from "../hooks/useWurpleArchive";
import { ArchiveCalendarContainer } from "./ArchiveCalendarContainer";

export default function ArchiveClient() {
  const router = useRouter();
  const archiveByDate = useWurpleArchive();

  // optional: keep selected date in this page so your detail panel shows the right info
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    // pick a reasonable default: today
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // If your calendar expects a `date` field inside each entry, adapt here.
  // (If it does NOT, you can remove this adapter and pass archiveByDate directly.)
  const calendarData = useMemo(() => {
    const out: Record<string, any> = {};
    for (const [dateKey, v] of Object.entries(archiveByDate)) {
      out[dateKey] = { date: dateKey, ...v };
    }
    return out;
  }, [archiveByDate]);

  return (
    <ArchiveCalendarContainer
      archiveByDate={calendarData}
      onSelectDate={(dateKey) => {
        setSelectedDateKey(dateKey);
        // If you want selecting a date to navigate immediately:
        // router.push(`/wurple/archive/${dateKey}?mode=easy`);
        console.log("Selected:", dateKey);
      }}
    />
  );
}

