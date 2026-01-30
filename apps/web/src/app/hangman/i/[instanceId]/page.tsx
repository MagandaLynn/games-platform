// apps/web/src/app/hangman/i/[instanceId]/page.tsx
import { prisma } from "@playseed/db";
import DailyHangmanClient from "../../daily/DailyHangmanClient";
import { notFound } from "next/navigation";
export const runtime = "nodejs";

export default async function HangmanInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const {instanceId} = await params;

  const instance = await prisma.hangmanDailyInstance.findUnique({
    where: { id: instanceId },
    include: { puzzle: true },
  });

  if (!instance) return notFound();

  return (
    <DailyHangmanClient
      instanceId={instance.id}
      category={instance.puzzle.category ?? null}
      hint={instance.puzzle.hint ?? null}
    />
  );
}
