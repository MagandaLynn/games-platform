import Link from "next/link";

export default function RPGPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">RPG Adventure</h1>
        
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 mb-6">
          <p className="text-lg mb-6 text-center text-text-muted">
            Embark on an epic adventure! Battle enemies, complete quests, and level up your character.
          </p>
          
          <div className="flex flex-col gap-4">
            <Link
              href="/rpg/play"
              className="block text-center px-6 py-4 bg-primary hover:bg-primaryHover text-white font-bold rounded-lg transition"
            >
              Start Adventure
            </Link>
            
            <Link
              href="/rpg/character"
              className="block text-center px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 font-semibold rounded-lg transition"
            >
              View Character
            </Link>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="space-y-2 text-text-muted">
            <li>🗡️ Turn-based combat system</li>
            <li>📈 Level up and increase your stats</li>
            <li>🎯 Complete quests for rewards</li>
            <li>💰 Collect gold and buy items</li>
            <li>👾 Battle various enemies</li>
            <li>🎒 Manage your inventory</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
