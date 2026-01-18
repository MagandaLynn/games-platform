// apps/web/src/app/hangman/page.tsx
import { redirect } from "next/navigation";

export default async function HangmanDailyEntry() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hangman/create-instance`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    // you can render an error page instead if you prefer
    return (
      <pre className="whitespace-pre-wrap text-sm">
        {`Failed to create daily instance (${res.status}).\n\n${await res.text()}`}
      </pre>
    );
  }

  const data = (await res.json()) as { instanceId: string };
  redirect(`/hangman/i/${data.instanceId}`);
}
