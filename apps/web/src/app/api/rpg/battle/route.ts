import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { games } from "@playseed/game-core";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sessionId = await requireSessionId();
    const body = await req.json().catch(() => ({}));
    const { action } = body; // "attack", "defend", "special", "flee"

    if (!action) {
      return Response.json({ error: "Action is required" }, { status: 400 });
    }

    const character = await prisma.rPGCharacter.findUnique({
      where: { sessionId },
    });

    if (!character) {
      return Response.json({ error: "Character not found" }, { status: 404 });
    }

    // For now, store battle state in memory/session
    // In production, you'd want to store this in the database
    // This is a simplified version - extend as needed

    return Response.json({
      message: "Battle system not fully implemented yet",
      action,
    });
  } catch (e: any) {
    console.error("[rpg/battle][POST]", e);
    return Response.json(
      {
        error: "Battle failed",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
