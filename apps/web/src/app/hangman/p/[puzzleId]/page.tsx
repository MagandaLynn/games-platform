import { redirect } from "next/navigation";
import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { utcMidnight } from "@/server/date";
// If using Clerk:
// import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export default async function PlayPuzzleByIdPage({
  params,
}: {
  params: Promise<{ puzzleId: string }>;
}) {
  const { puzzleId } = await params;
  if (!puzzleId) redirect("/hangman");

  const sessionId = await requireSessionId();
  const userId = null as string | null; // const { userId } = auth();

  const puzzle = await prisma.hangmanPuzzle.findUnique({
    where: { id: puzzleId },
    select: { id: true },
  });
  if (!puzzle) redirect("/hangman/saved");

  const instance = await prisma.hangmanDailyInstance.create({
    data: {
      date: utcMidnight(new Date()),
      mode: "custom",
      puzzleId: puzzle.id,
    },
    select: { id: true },
  });

  // optional: if you store "lastInstanceId" in saved table, update it
  if (userId || sessionId) {
    const where = userId
      ? { puzzleId_userId: { puzzleId, userId } }
      : { puzzleId_sessionId: { puzzleId, sessionId } };

    await prisma.savedHangmanPuzzle.update({
      where: where as any,
      data: { lastInstanceId: instance.id },
    }).catch(() => null);
  }

  redirect(`/hangman/i/${instance.id}`);
}
