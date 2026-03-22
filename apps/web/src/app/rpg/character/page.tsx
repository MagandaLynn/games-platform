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

export default function RPGCharacterPage() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCharacter();
  }, []);

  async function loadCharacter() {
    try {
      const res = await fetch("/api/rpg/character");
      const data = await res.json();
      setCharacter(data.character);
    } catch (e) {
      console.error("Failed to load character:", e);
    } finally {
      setLoading(false);
    }
  }

  async function createCharacter(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/rpg/character/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create character");
        return;
      }

      const data = await res.json();
      setCharacter(data.character);
      setName("");
    } catch (e) {
      console.error("Failed to create character:", e);
      alert("Failed to create character");
    } finally {
      setCreating(false);
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Create Character</h1>
          
          <form onSubmit={createCharacter} className="bg-white/5 rounded-xl border border-white/10 p-6">
            <label className="block mb-4">
              <span className="text-sm font-semibold mb-2 block">Character Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your hero's name"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={20}
                required
              />
            </label>
            
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full px-6 py-3 bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
            >
              {creating ? "Creating..." : "Create Character"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{character.name}</h1>
        
        <div className="grid gap-4 mb-6">
          {/* Stats Card */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-text-muted">Level</div>
                <div className="text-2xl font-bold">{character.level}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Gold</div>
                <div className="text-2xl font-bold">💰 {character.gold}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>HP</span>
                <span>{character.hp} / {character.maxHp}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>XP</span>
                <span>{character.xp}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "60%" }} />
              </div>
            </div>
          </div>

          {/* Combat Stats */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-text-muted">⚔️ Strength</div>
                <div className="text-xl font-bold">{character.stats.strength}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">🛡️ Defense</div>
                <div className="text-xl font-bold">{character.stats.defense}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">🧠 Intelligence</div>
                <div className="text-xl font-bold">{character.stats.intelligence}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">⚡ Speed</div>
                <div className="text-xl font-bold">{character.stats.speed}</div>
              </div>
            </div>
          </div>

          {/* Quests */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4">Quests Completed</h2>
            {character.questsCompleted.length > 0 ? (
              <div className="text-text-muted">{character.questsCompleted.length} quests</div>
            ) : (
              <div className="text-text-muted">No quests completed yet</div>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/rpg/play")}
          className="w-full px-6 py-3 bg-primary hover:bg-primaryHover text-white font-bold rounded-lg transition"
        >
          Start Adventure
        </button>
      </div>
    </div>
  );
}
