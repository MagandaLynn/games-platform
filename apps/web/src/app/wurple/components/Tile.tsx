// apps/web/src/app/wurple/components/Tile.tsx
import React from "react";

export default function Tile({
  char,
  status,
  delayMs,
  animate,
}: {
  char: string;
  status: "correct" | "present" | "absent";
  delayMs: number;
  animate: boolean;
}) {
  const size = 44;

  const backBg =
    status === "correct"
      ? "bg-emerald-500"
      : status === "present"
      ? "bg-amber-400"
      : "bg-slate-700";

  const backFg =
    status === "correct"
      ? "text-emerald-950"
      : status === "present"
      ? "text-amber-950"
      : "text-slate-50";

  return (
    <div
      className="shrink-0"
      style={{
        width: size,
        height: size,
        perspective: 700,
      }}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          borderRadius: 10,
          animationName: animate ? "tileFlip" : "revealStatic",
          animationDuration: "520ms",
          animationTimingFunction: "ease-in-out",
          animationDelay: animate ? `${delayMs}ms` : "0ms",
          animationFillMode: "both",
        }}
      >
        {/* FRONT: unguessed */}
        <div
          className="
            absolute inset-0 grid place-items-center select-none rounded-[10px]
            bg-bg-panel
            border border-slate-400/70
            shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]
            dark:bg-bg-panel
            dark:border-white/20
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
          "
          style={{ backfaceVisibility: "hidden" }}
        />

        {/* BACK: revealed */}
        <div
          className={[
            "absolute inset-0 grid place-items-center select-none rounded-[10px]",
            backBg,
            backFg,
            "border border-black/10 dark:border-white/15",
            "font-mono font-extrabold tracking-[0.08em]",
          ].join(" ")}
          style={{
            transform: "rotateX(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          {char === " " ? "" : char}
        </div>
      </div>
    </div>
  );
}
