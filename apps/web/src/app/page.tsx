export default async function Home() {
  const res = await fetch("http://localhost:3000/api/wurple/daily?seed=2026-01-06", {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  return (
    <main style={{ padding: 24 }}>
      <h1>Wurple reboot</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
