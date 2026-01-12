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
  const bg =
    status === "correct" ? "#22c55e" :
    status === "present" ? "#eab308" :
    "#374151";

  const fg =
    status === "correct" ? "#0b1b10" :
    status === "present" ? "#1a1402" :
    "#f9fafb";

  const size = 44;
  

  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: 700,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          borderRadius: 10,
          animationName: animate ? "tileFlip" : "revealStatic",
        animationDuration: "520ms",
        animationTimingFunction: "ease-in-out",
        animationDelay: animate ? `${delayMs}ms` : "0ms",
        animationFillMode: "both",

        }}
      >
        {/* FRONT: neutral, no letter */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: 10,
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.20)",
            backfaceVisibility: "hidden",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontWeight: 800,
            letterSpacing: 1,
            color: "#e5e7eb",
            userSelect: "none",
          }}
        >
          {/* intentionally blank on front */}
        </div>

        {/* BACK: revealed color + letter */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: 10,
            background: bg,
            border: "1px solid rgba(255,255,255,0.15)",
            color: fg,
            transform: "rotateX(180deg)",
            backfaceVisibility: "hidden",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontWeight: 800,
            letterSpacing: 1,
            userSelect: "none",
          }}
        >
          {char === " " ? "" : char}
        </div>
      </div>
    </div>
  );
}