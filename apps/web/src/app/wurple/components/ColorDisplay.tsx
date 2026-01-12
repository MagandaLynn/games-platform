function isHex6(s: string) {
  return /^[0-9A-F]{6}$/.test(s.toUpperCase());
}

export default function ColorDisplay({
  seed,
  mode,
  guessHex,
}: {
  seed: string;
  mode: "easy" | "challenge";
  guessHex?: string;
}) {
  const guess = (guessHex ?? "").toUpperCase();
  const guessColor = isHex6(guess) ? `#${guess}` : "#0b3a4a"; // fallback

  return (
    <div
      style={{
        width: 180,
        height: 110,
        borderRadius: 22,
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.18)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ height: "50%", background: "#111827" }}>
        <img
          alt="Target color"
          src={`/api/wurple/target?seed=${encodeURIComponent(seed)}&mode=${mode}`}
          style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        />
      </div>
      <div style={{ height: "50%", background: guessColor }} />
    </div>
  );
}

