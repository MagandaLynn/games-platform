"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Character = {
  id: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  gold: number;
  stats: {
    strength: number;
    defense: number;
    intelligence: number;
    speed: number;
  };
  currentLocation: string;
  inventory: any[];
  questsCompleted: string[];
};

export default function RPGPlayPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCharacter();
  }, []);

  async function loadCharacter() {
    try {
      const res = await fetch("/api/rpg/character");
      const data = await res.json();
      
      if (!data.character) {
        router.push("/rpg/character");
        return;
      }
      
      setCharacter(data.character);
    } catch (e) {
      console.error("Failed to load character:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{character.name}</h1>
            <div className="flex gap-4 text-sm">
              <span>Level {character.level}</span>
              <span>💰 {character.gold}</span>
            </div>
          </div>
          
          <div className="flex gap-2 text-sm">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span>HP</span>
                <span>{character.hp}/{character.maxHp}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Town Square</h2>
          <p className="text-text-muted mb-6">
            You are in the town square. What would you like to do?
          </p>

          <div className="grid gap-4">
            <button className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition">
              <div className="font-semibold">🗡️ Go on Adventure</div>
              <div className="text-sm text-text-muted">Battle enemies and gain experience</div>
            </button>

            <button className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition">
              <div className="font-semibold">📜 View Quests</div>
              <div className="text-sm text-text-muted">See available quests</div>
            </button>

            <button className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition">
              <div className="font-semibold">🏪 Visit Shop</div>
              <div className="text-sm text-text-muted">Buy and sell items</div>
            </button>

            <button
              onClick={() => router.push("/rpg/character")}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition"
            >
              <div className="font-semibold">👤 Character Info</div>
              <div className="text-sm text-text-muted">View your stats and progress</div>
            </button>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-200">
          🚧 This is a work in progress. More features coming soon!
        </div>
      </div>
    </div>
  );
}
