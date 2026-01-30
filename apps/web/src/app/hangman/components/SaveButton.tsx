"use client";

import * as React from "react";

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function SavePuzzleButton({
  puzzleId,
  initialSaved,
  className,
  size = "sm",
}: {
  puzzleId: string;
  initialSaved: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function toggle() {
    if (pending) return;
    setErr(null);
    setPending(true);

    const next = !saved;
    // optimistic
    setSaved(next);

    try {
      const res = await fetch(`/api/hangman/puzzles/${puzzleId}/save`, {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) {
        // revert
        setSaved(!next);
        setErr(text || "Failed to update save.");
      }
    } catch (e: any) {
      setSaved(!next);
      setErr(e?.message ?? "Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cx("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={cx(
          "rounded-xl border border-white/10 bg-white/5 font-extrabold hover:opacity-90 transition",
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          saved ? "text-yellow-200" : "text-text"
        )}
        aria-pressed={saved}
      >
        {saved ? "★ Saved" : "☆ Save"}
      </button>

      {err && <span className="text-xs text-red-300">{err}</span>}
    </div>
  );
}
