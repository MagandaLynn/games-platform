import type {
  RPGCharacter,
  RPGCharacterStats,
  RPGEnemy,
  RPGBattleState,
  RPGBattleAction,
  RPGItem,
} from "./types";

export function createCharacter(name: string): RPGCharacter {
  return {
    id: "",
    name,
    level: 1,
    xp: 0,
    hp: 100,
    maxHp: 100,
    gold: 50,
    stats: {
      strength: 10,
      defense: 10,
      intelligence: 10,
      speed: 10,
    },
    currentLocation: "town",
    inventory: [],
    questsCompleted: [],
  };
}

export function calculateXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function canLevelUp(character: RPGCharacter): boolean {
  const xpNeeded = calculateXPForLevel(character.level + 1);
  return character.xp >= xpNeeded;
}

export function levelUp(character: RPGCharacter): RPGCharacter {
  if (!canLevelUp(character)) return character;

  const xpNeeded = calculateXPForLevel(character.level + 1);

  return {
    ...character,
    level: character.level + 1,
    xp: character.xp - xpNeeded,
    maxHp: character.maxHp + 10,
    hp: character.maxHp + 10,
    stats: {
      strength: character.stats.strength + 2,
      defense: character.stats.defense + 2,
      intelligence: character.stats.intelligence + 2,
      speed: character.stats.speed + 1,
    },
  };
}

export function createBattle(character: RPGCharacter, enemy: RPGEnemy): RPGBattleState {
  return {
    turn: 1,
    character: { ...character },
    enemy: { ...enemy },
    isPlayerTurn: character.stats.speed >= enemy.stats.speed,
    log: [`Battle started against ${enemy.name}!`],
  };
}

export function calculateDamage(
  attacker: RPGCharacterStats,
  defender: RPGCharacterStats,
  action: RPGBattleAction
): number {
  const baseDamage = attacker.strength;
  const defense = defender.defense;

  let multiplier = 1;
  if (action === "attack") {
    multiplier = 1;
  } else if (action === "special") {
    multiplier = 1.5;
  } else if (action === "defend") {
    multiplier = 0.5;
  }

  const damage = Math.max(1, Math.floor((baseDamage * multiplier - defense / 2) * (0.85 + Math.random() * 0.3)));
  return damage;
}

export function processBattleAction(
  state: RPGBattleState,
  action: RPGBattleAction
): RPGBattleState {
  const newState = { ...state };
  const newLog = [...state.log];

  if (state.result) {
    return state; // Battle is over
  }

  // Handle flee
  if (action === "flee") {
    const fleeChance = 0.5;
    if (Math.random() < fleeChance) {
      newLog.push("You fled the battle!");
      return {
        ...newState,
        result: "fled",
        log: newLog,
      };
    } else {
      newLog.push("Failed to flee!");
    }
  }

  // Player turn
  if (state.isPlayerTurn && action !== "flee") {
    const damage = calculateDamage(state.character.stats, state.enemy.stats, action);
    newState.enemy = {
      ...state.enemy,
      hp: Math.max(0, state.enemy.hp - damage),
    };

    if (action === "attack") {
      newLog.push(`You attack for ${damage} damage!`);
    } else if (action === "special") {
      newLog.push(`You use a special attack for ${damage} damage!`);
    } else if (action === "defend") {
      newLog.push("You take a defensive stance.");
    }

    // Check if enemy is defeated
    if (newState.enemy.hp <= 0) {
      newLog.push(`You defeated ${state.enemy.name}!`);
      newLog.push(`Gained ${state.enemy.xpReward} XP and ${state.enemy.goldReward} gold!`);
      return {
        ...newState,
        result: "won",
        log: newLog,
      };
    }

    newState.isPlayerTurn = false;
  }

  // Enemy turn
  if (!newState.isPlayerTurn) {
    const enemyAction: RPGBattleAction = "attack";
    const damage = calculateDamage(state.enemy.stats, state.character.stats, enemyAction);
    newState.character = {
      ...state.character,
      hp: Math.max(0, state.character.hp - damage),
    };

    newLog.push(`${state.enemy.name} attacks for ${damage} damage!`);

    // Check if character is defeated
    if (newState.character.hp <= 0) {
      newLog.push("You were defeated!");
      return {
        ...newState,
        result: "lost",
        log: newLog,
      };
    }

    newState.isPlayerTurn = true;
    newState.turn += 1;
  }

  return {
    ...newState,
    log: newLog,
  };
}

export function useItem(character: RPGCharacter, item: RPGItem): RPGCharacter {
  if (item.type === "potion" && item.healAmount) {
    const newHp = Math.min(character.maxHp, character.hp + item.healAmount);
    return {
      ...character,
      hp: newHp,
      inventory: character.inventory.filter((i) => i.id !== item.id),
    };
  }

  // Equipment items modify stats but stay in inventory
  if (item.type === "weapon" || item.type === "armor") {
    return character;
  }

  return character;
}

export function buyItem(character: RPGCharacter, item: RPGItem): RPGCharacter | null {
  const cost = item.value || 0;
  if (character.gold < cost) {
    return null; // Can't afford
  }

  return {
    ...character,
    gold: character.gold - cost,
    inventory: [...character.inventory, item],
  };
}

export function sellItem(character: RPGCharacter, item: RPGItem): RPGCharacter {
  const sellValue = Math.floor((item.value || 0) * 0.5);
  return {
    ...character,
    gold: character.gold + sellValue,
    inventory: character.inventory.filter((i) => i.id !== item.id),
  };
}
