import type { RPGQuest, RPGItem } from "./types";

export const QUESTS: Record<string, RPGQuest> = {
  first_steps: {
    id: "first_steps",
    title: "First Steps",
    description: "Defeat 3 slimes to prove yourself as an adventurer.",
    requirements: {},
    objectives: [
      {
        type: "kill",
        target: "slime",
        count: 3,
      },
    ],
    rewards: {
      xp: 50,
      gold: 25,
    },
  },
  goblin_menace: {
    id: "goblin_menace",
    title: "Goblin Menace",
    description: "The town is being harassed by goblins. Defeat 5 goblins.",
    requirements: {
      level: 2,
    },
    objectives: [
      {
        type: "kill",
        target: "goblin",
        count: 5,
      },
    ],
    rewards: {
      xp: 100,
      gold: 50,
      items: [
        {
          id: "iron_sword",
          name: "Iron Sword",
          type: "weapon",
          stats: { strength: 5 },
          value: 100,
        },
      ],
    },
  },
  wolf_hunt: {
    id: "wolf_hunt",
    title: "Wolf Hunt",
    description: "Wolves are threatening the nearby forest. Hunt down 4 wolves.",
    requirements: {
      level: 3,
      questsCompleted: ["first_steps"],
    },
    objectives: [
      {
        type: "kill",
        target: "wolf",
        count: 4,
      },
    ],
    rewards: {
      xp: 150,
      gold: 75,
    },
  },
};

export const ITEMS: Record<string, RPGItem> = {
  health_potion: {
    id: "health_potion",
    name: "Health Potion",
    type: "potion",
    description: "Restores 50 HP",
    healAmount: 50,
    value: 20,
  },
  mega_potion: {
    id: "mega_potion",
    name: "Mega Potion",
    type: "potion",
    description: "Restores 100 HP",
    healAmount: 100,
    value: 50,
  },
  iron_sword: {
    id: "iron_sword",
    name: "Iron Sword",
    type: "weapon",
    description: "A sturdy iron sword",
    stats: { strength: 5 },
    value: 100,
  },
  steel_armor: {
    id: "steel_armor",
    name: "Steel Armor",
    type: "armor",
    description: "Protective steel armor",
    stats: { defense: 5 },
    value: 150,
  },
  leather_armor: {
    id: "leather_armor",
    name: "Leather Armor",
    type: "armor",
    description: "Light leather armor",
    stats: { defense: 3 },
    value: 75,
  },
};

export function getQuestById(id: string): RPGQuest | null {
  return QUESTS[id] || null;
}

export function getItemById(id: string): RPGItem | null {
  return ITEMS[id] || null;
}

export function checkQuestRequirements(
  quest: RPGQuest,
  characterLevel: number,
  questsCompleted: string[]
): boolean {
  if (quest.requirements.level && characterLevel < quest.requirements.level) {
    return false;
  }

  if (quest.requirements.questsCompleted) {
    for (const requiredQuest of quest.requirements.questsCompleted) {
      if (!questsCompleted.includes(requiredQuest)) {
        return false;
      }
    }
  }

  return true;
}
