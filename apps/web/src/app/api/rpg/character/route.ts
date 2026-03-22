import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessionId = await requireSessionId();

    const character = await prisma.rPGCharacter.findUnique({
      where: { sessionId },
    });

    if (!character) {
      return Response.json({ character: null });
    }

    return Response.json({
      character: {
        id: character.id,
        name: character.name,
        level: character.level,
        xp: character.xp,
        hp: character.hp,
        maxHp: character.maxHp,
        gold: character.gold,
        stats: {
          strength: character.strength,
          defense: character.defense,
          intelligence: character.intelligence,
          speed: character.speed,
        },
        currentLocation: character.currentLocation,
        inventory: JSON.parse(character.inventory),
        questsCompleted: JSON.parse(character.questsCompleted),
      },
    });
  } catch (e: any) {
    console.error("[rpg/character][GET]", e);
    return Response.json(
      {
        error: "Failed to fetch character",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
