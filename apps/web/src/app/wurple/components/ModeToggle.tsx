export default function ModeToggle({mode, setMode,}: {mode: "easy" | "challenge"; setMode: (mode: "easy" | "challenge") => void}) { 
    return(<div style={{ display: "flex", gap: 12 }}>
    <button
        type="button"
        onClick={() => setMode("easy")}
        style={{
            padding: "8px 12px",
            borderRadius: 10,
            fontWeight: 800,
            background: mode === "easy" ? "#2563eb" : "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
        }}
    >
        Easy
    </button>

    <button
        type="button"
        onClick={() => {
            setMode("challenge");
        }}
        style={{
            padding: "8px 12px",
            borderRadius: 10,
            fontWeight: 800,
            background: mode === "challenge" ? "#2563eb" : "#1f2937",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
        }}
    >
        Challenge
    </button>
    </div>
    )
}
