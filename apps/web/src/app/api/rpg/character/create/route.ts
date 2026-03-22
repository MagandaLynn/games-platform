import { prisma } from "@playseed/db";
import { requireSessionId } from "@/server/session";
import { games } from "@playseed/game-core";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sessionId = await requireSessionId();
    const body = await req.json().catch(() => ({}));
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if character already exists for this session
    const existing = await prisma.rPGCharacter.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return Response.json({ error: "Character already exists" }, { status: 400 });
    }

    // Create new character
    const characterData = games.rpg.createCharacter(name.trim());

    const character = await prisma.rPGCharacter.create({
      data: {
        sessionId,
        name: characterData.name,
        level: characterData.level,
        xp: characterData.xp,
        hp: characterData.hp,
        maxHp: characterData.maxHp,
        gold: characterData.gold,
        strength: characterData.stats.strength,
        defense: characterData.stats.defense,
        intelligence: characterData.stats.intelligence,
        speed: characterData.stats.speed,
        currentLocation: characterData.currentLocation,
        questsCompleted: JSON.stringify(characterData.questsCompleted),
        inventory: JSON.stringify(characterData.inventory),
      },
    });

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
    console.error("[rpg/character/create][POST]", e);
    return Response.json(
      {
        error: "Failed to create character",
        message: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
