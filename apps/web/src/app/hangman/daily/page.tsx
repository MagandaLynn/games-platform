import { headers } from "next/headers";

async function baseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

import DailyHangmanClient from "./DailyHangmanClient";

export default async function DailyHangmanPage() {
  const base = await baseUrl();
  const res = await fetch(`${base}/api/hangman/create-instance`, {
    method: "GET",
    cache: "no-store",
    // IMPORTANT: forward the incoming cookie to this request

    headers: { cookie: (await headers()).get("cookie") ?? "" },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`create-instance failed: ${res.status} ${text}`);
  }

  const instance = JSON.parse(text) as {
    instanceId: string;
    mode: "daily";
    date: string;
    hint: string | null;
    category: string | null;
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      <h1>Daily Hangman</h1>
      <p><strong>Category:</strong> {instance.category ?? "—"}</p>
      {instance.hint && <p><strong>Hint:</strong> {instance.hint}</p>}

      <DailyHangmanClient instanceId={instance.instanceId} />
    </main>
  );
}
