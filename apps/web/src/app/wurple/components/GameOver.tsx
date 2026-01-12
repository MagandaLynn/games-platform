export default function GameOver({ status }: { status: "won" | "lost" }) {
    return (
        <p style={{ marginTop: 16, fontWeight: 600 }}>
            {status === "won" ? "You won 🎉" : "Game over 💀"}{" "}
            Come back tomorrow.
        </p>
    )
}