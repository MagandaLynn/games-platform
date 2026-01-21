import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sessionId = await requireSessionId();
    const body = await req.json().catch(() => ({}));
    const instanceId: string | undefined = body.instanceId;

    if (!instanceId) {
      return Response.json({ error: "instanceId is required" }, { status: 400 });
    }

    // Ensure the play exists (same pattern as your state route)
    const play = await prisma.hangmanPlay.upsert({
      where: { instance_session: { instanceId, sessionId } },
      update: {},
      create: { instanceId, sessionId },
    });

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
