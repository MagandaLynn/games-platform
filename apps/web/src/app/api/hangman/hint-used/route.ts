import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { auth } from "@clerk/nextjs/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sessionId = await requireSessionId();
    const { userId } = await auth();
    const body = await req.json().catch(() => ({}));
    const instanceId: string | undefined = body.instanceId;

    if (!instanceId) {
      return Response.json({ error: "instanceId is required" }, { status: 400 });
    }

    // Try to find existing play by userId first, then sessionId
    let play = null;

    if (userId) {
      play = await prisma.hangmanPlay.findFirst({
        where: { instanceId, userId },
      });
    }

    if (!play) {
      const sessionPlay = await prisma.hangmanPlay.findFirst({
        where: { instanceId, sessionId },
      });

      if (sessionPlay) {
        if (userId && !sessionPlay.userId) {
          await prisma.hangmanPlay.update({
            where: { id: sessionPlay.id },
            data: { userId },
          });
        }
        play = sessionPlay;
      }
    }

    if (!play) {
      play = await prisma.hangmanPlay.create({
        data: { instanceId, sessionId, userId },
      });
    }

    // Idempotent update: if already used, keep existing timestamp
    const updated = await prisma.hangmanPlay.update({
      where: { id: play.id },
      data: {
        hintUsed: true,
        hintUsedAt: play.hintUsedAt ?? new Date(),
      },
      select: {
        hintUsed: true,
        hintUsedAt: true,
      },
    });

    return Response.json({
      ok: true,
      hintUsed: updated.hintUsed,
      hintUsedAt: updated.hintUsedAt ? updated.hintUsedAt.toISOString() : null,
    });
  } catch (e: any) {
    console.error("[hangman/hint-used][POST]", e);
    return Response.json(
      {
        error: "hint-used failed",
        message: e?.message ?? String(e),
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
