export type RPGCharacterStats = {
  strength: number;
  defense: number;
  intelligence: number;
  speed: number;
};

export type RPGCharacter = {
  id: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  gold: number;
  stats: RPGCharacterStats;
  currentLocation: string;
  inventory: RPGItem[];
  questsCompleted: string[];
};

export type RPGItem = {
  id: string;
  name: string;
  type: "weapon" | "armor" | "potion" | "quest";
  description?: string;
  stats?: Partial<RPGCharacterStats>;
  healAmount?: number;
  value?: number;
};

export type RPGEnemy = {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  stats: RPGCharacterStats;
  xpReward: number;
  goldReward: number;
};

export type RPGBattleAction = "attack" | "defend" | "special" | "flee";

export type RPGBattleState = {
  turn: number;
  character: RPGCharacter;
  enemy: RPGEnemy;
  isPlayerTurn: boolean;
  result?: "won" | "lost" | "fled";
  log: string[];
};

export type RPGQuest = {
  id: string;
  title: string;
  description: string;
  requirements: {
    level?: number;
    items?: string[];
    questsCompleted?: string[];
  };
  objectives: {
    type: "kill" | "collect" | "explore" | "talk";
    target: string;
    count: number;
  }[];
  rewards: {
    xp: number;
    gold: number;
    items?: RPGItem[];
  };
};

export type RPGQuestProgress = {
  questId: string;
  status: "active" | "completed" | "failed";
  progress: Record<string, number>;
};

export type RPGLocation = {
  id: string;
  name: string;
  description: string;
  connectedTo: string[];
  enemies?: string[];
  npcs?: RPGNPC[];
  shop?: RPGShop;
};

export type RPGNPC = {
  id: string;
  name: string;
  dialogue: string[];
  quests?: string[];
};

export type RPGShop = {
  items: RPGItem[];
};
