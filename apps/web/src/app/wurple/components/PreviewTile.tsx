import { PreviewStatus } from "../helpers/types";

export default function PreviewTile({
  char,
  kind,
  isCursor
}: {
  char: string;
  kind: PreviewStatus;
  isCursor?: boolean;
}) {
  const base: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontWeight: 800,
    letterSpacing: 1,
    userSelect: "none",
    border: isCursor
    ? "2px solid rgba(59,130,246,0.8)"
    : "1px solid rgba(255,255,255,0.2)"

    
  };

  const style =
    kind === "pending"
      ? { ...base, background: "#111827", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.20)" }
      : { ...base, background: "transparent", color: "#e5e7eb", border: "1px solid rgba(255,255,255,0.10)" };

  return <div style={style}>{char === " " ? "" : char}</div>;
}
