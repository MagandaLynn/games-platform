// useWurpleArchive.ts
"use client";

import { useEffect, useState } from "react";
import { ArchiveByDate, loadArchiveFromLocalStorage } from "../helpers/loadArchiveFromLocalStorage.ts";

export function useWurpleArchive() {
  const [archiveByDate, setArchiveByDate] = useState<ArchiveByDate>({});

  useEffect(() => {
    const load = () => setArchiveByDate(loadArchiveFromLocalStorage());
    load();

    // Update when another tab writes results
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  return archiveByDate;
}
