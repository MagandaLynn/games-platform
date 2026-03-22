import type { RPGEnemy } from "./types";

export const ENEMIES: Record<string, RPGEnemy> = {
  slime: {
    id: "slime",
    name: "Slime",
    level: 1,
    hp: 30,
    maxHp: 30,
    stats: {
      strength: 5,
      defense: 3,
      intelligence: 2,
      speed: 3,
    },
    xpReward: 10,
    goldReward: 5,
  },
  goblin: {
    id: "goblin",
    name: "Goblin",
    level: 2,
    hp: 50,
    maxHp: 50,
    stats: {
      strength: 8,
      defense: 5,
      intelligence: 4,
      speed: 7,
    },
    xpReward: 20,
    goldReward: 10,
  },
  wolf: {
    id: "wolf",
    name: "Wolf",
    level: 3,
    hp: 60,
    maxHp: 60,
    stats: {
      strength: 12,
      defense: 6,
      intelligence: 5,
      speed: 12,
    },
    xpReward: 30,
    goldReward: 15,
  },
  orc: {
    id: "orc",
    name: "Orc",
    level: 5,
    hp: 100,
    maxHp: 100,
    stats: {
      strength: 15,
      defense: 10,
      intelligence: 5,
      speed: 6,
    },
    xpReward: 50,
    goldReward: 25,
  },
  dragon: {
    id: "dragon",
    name: "Dragon",
    level: 10,
    hp: 300,
    maxHp: 300,
    stats: {
      strength: 30,
      defense: 25,
      intelligence: 20,
      speed: 15,
    },
    xpReward: 200,
    goldReward: 100,
  },
};

export function getEnemyById(id: string): RPGEnemy | null {
  const enemy = ENEMIES[id];
  return enemy || null;
}

export function getRandomEnemy(minLevel: number = 1, maxLevel: number = 10): RPGEnemy {
  const validEnemies = Object.values(ENEMIES).filter(
    (e) => e.level >= minLevel && e.level <= maxLevel
  );

  if (validEnemies.length === 0) {
    const slime = ENEMIES["slime"];
    if (!slime) throw new Error("Slime enemy not found");
    return slime;
  }

  return validEnemies[Math.floor(Math.random() * validEnemies.length)]!;
}
