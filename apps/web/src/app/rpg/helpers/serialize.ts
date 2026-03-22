import type { RPGCharacter } from "@playseed/game-core";

export function serializeCharacter(dbCharacter: any): RPGCharacter {
  return {
    id: dbCharacter.id,
    name: dbCharacter.name,
    level: dbCharacter.level,
    xp: dbCharacter.xp,
    hp: dbCharacter.hp,
    maxHp: dbCharacter.maxHp,
    gold: dbCharacter.gold,
    stats: {
      strength: dbCharacter.strength,
      defense: dbCharacter.defense,
      intelligence: dbCharacter.intelligence,
      speed: dbCharacter.speed,
    },
    currentLocation: dbCharacter.currentLocation,
    inventory: JSON.parse(dbCharacter.inventory || "[]"),
    questsCompleted: JSON.parse(dbCharacter.questsCompleted || "[]"),
  };
}
