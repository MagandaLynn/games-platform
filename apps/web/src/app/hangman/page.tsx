import Link from "next/link";

export default function HangmanLandingPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
        Hangman
      </h1>

      <p style={{ marginBottom: "2rem", opacity: 0.8 }}>
        Create your own puzzles or play the daily challenge.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Primary */}
        <Link href="/hangman/create">
          <button
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create a Custom Puzzle
          </button>
        </Link>

        {/* Secondary */}
        <Link href="/hangman/daily">
          <button
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "0.95rem",
              opacity: 0.8,
              cursor: "pointer",
            }}
          >
            Play Today's Daily
          </button>
        </Link>
      </div>
    </main>
  );
}

