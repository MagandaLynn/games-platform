import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
// If using Clerk:
// import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: Promise<{ puzzleId: string }> }) {
  const sessionId = await requireSessionId();
  const userId = null as string | null; // replace with Clerk auth()
  // const { userId } = auth();

  const { puzzleId } = await ctx.params;
  if (!puzzleId) return Response.json({ error: "puzzleId is required" }, { status: 400 });

  const where = userId
    ? { puzzleId_userId: { puzzleId, userId } }
    : { puzzleId_sessionId: { puzzleId, sessionId } };

  const saved = await prisma.savedHangmanPuzzle.upsert({
    where: where as any,
    update: { savedAt: new Date() },
    create: {
      puzzleId,
      savedAt: new Date(),
      userId: userId ?? null,
      sessionId: userId ? null : sessionId,
    },
    select: { id: true, savedAt: true },
  });

  return Response.json({ ok: true, saved });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ puzzleId: string }> }) {
  const sessionId = await requireSessionId();
  const userId = null as string | null; // replace with Clerk auth()
  // const { userId } = auth();

  const { puzzleId } = await ctx.params;
  if (!puzzleId) return Response.json({ error: "puzzleId is required" }, { status: 400 });

  const where = userId
    ? { puzzleId_userId: { puzzleId, userId } }
    : { puzzleId_sessionId: { puzzleId, sessionId } };

  await prisma.savedHangmanPuzzle.delete({ where: where as any }).catch(() => null);

  return Response.json({ ok: true });
}
