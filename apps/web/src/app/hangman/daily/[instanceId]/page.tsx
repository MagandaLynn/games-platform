// apps/web/src/app/hangman/i/[instanceId]/page.tsx
import DailyHangmanClient from "../../daily/DailyHangmanClient";
import { prisma } from "@playseed/db";
export const runtime = "nodejs";

export default async function HangmanByInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;

  const instance = await prisma.hangmanDailyInstance.findUnique({
    where: { id: instanceId },
    include: { puzzle: true },
  });

  if (!instance) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-bold">Puzzle not found</h1>
        <p className="mt-2 text-text-muted">That link may be invalid or expired.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <DailyHangmanClient
        instanceId={instance.id}
        category={instance.puzzle.category ?? null}
        hint={instance.puzzle.hint ?? null}
      />
    </div>
  );
}
