

export default function GuessSwatch({
  guess,
  distance,
}: {
  guess: string;
  distance?: number;
}) {
  const g = guess.trim().toUpperCase();
  const isHex = /^[0-9A-F]{6}$/.test(g);
  const color = isHex ? `#${g}` : "transparent";

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 6 }}>
      <div
        title={isHex ? `#${g}` : "—"}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: color,
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: isHex ? "0 6px 16px rgba(0,0,0,0.45)" : undefined,
        }}
      />
      {typeof distance === "number" && (
        <div style={{ fontSize: 11, opacity: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {distance.toFixed(0)}
        </div>
      )}
    </div>
  );
}
