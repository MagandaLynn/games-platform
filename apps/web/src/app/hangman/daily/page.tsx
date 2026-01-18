import { headers } from "next/headers";

async function baseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

import DailyHangmanClient from "./DailyHangmanClient";
import { HintReveal } from "../components/HintReveal";
import { DailyContainer } from "../components/DailyContainer";

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
  console.log("DailyHangmanPage instance:", instance);

  return (
    <main >
      <DailyHangmanClient instanceId={instance.instanceId} category={instance.category} hint={instance.hint} />

      <div>
    
    </div>
    </main>
  );
}
