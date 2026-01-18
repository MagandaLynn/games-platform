import DailyHangmanClient from "../../daily/DailyHangmanClient";
import { headers } from "next/headers";

async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

export default async function CustomHangmanPage({
  params,
}: {
  params: Promise<{ puzzleId: string }>;
}) {
  const puzzleId = (await params).puzzleId;
    console.log("CustomHangmanPage puzzleId:", puzzleId);
    console.log("Params:", params);
  const res = await fetch(`${await getBaseUrl()}/api/hangman/create-instance`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "custom", puzzleId }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return (
      <pre className="whitespace-pre-wrap text-sm">
        {`Failed to create custom instance (${res.status}).\n\n${text}`}
      </pre>
    );
  }

  const data = (await res.json()) as {
    instanceId: string;
    mode: "custom";
    date: string;
    hint: string | null;
    category: string | null;
  };

  return (
    <DailyHangmanClient
      instanceId={data.instanceId}
      category={data.category}
      hint={data.hint}
    />
  );
}
