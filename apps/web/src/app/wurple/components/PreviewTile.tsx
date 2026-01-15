// apps/web/src/app/wurple/components/PreviewTile.tsx
import React from "react";

export default function PreviewTile({
  char,
  kind,
  isCursor = false,
}: {
  char: string;
  kind: "pending" | "empty";
  isCursor?: boolean;
}) {
  const size = 44;
  const showChar = char === " " ? "" : char;

  // Base styling
  const base =
    "grid place-items-center rounded-[10px] select-none font-mono font-extrabold tracking-[0.08em]";

  // Theme-aware surface styling (no hardcoded slate)
  const surface =
    "border border-tile-border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

  // Pending row: uses active tile background + normal text token
  // Keep opacity token for your preview fade
  const pending =
    "bg-tile-active text-text opacity-[var(--color-preview-opacity)] " +
    (isCursor ? "ring-2 ring-link animate-[readyPulse_600ms_ease-in-out_infinite]" : "");

  // Empty row: future tile background + muted text token
  const empty = "bg-tile-future text-textMuted";

  return (
    <div
      className={[base, surface, kind === "pending" ? pending : empty].join(" ")}
      style={{ width: size, height: size }}
      aria-label={kind === "pending" ? "Pending tile" : "Empty tile"}
    >
      {showChar}
    </div>
  );
}
