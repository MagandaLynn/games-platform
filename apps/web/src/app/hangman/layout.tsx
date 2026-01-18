"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HangmanStatsModal } from "./components/HangmantStatsModal";
import { HangmanRulesModal } from "./components/RulesModal";
import GameBar from "../appComponents/GameBar";


export default function Page({ children }: { children: React.ReactNode }) {
    const [showRules, setShowRules] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const pathname = usePathname();
    
    const isDailyMode = pathname?.includes('/hangman/daily');
    const mode = isDailyMode ? "daily" : "custom";
    const subtitle = isDailyMode ? "Today's Puzzle" : "Custom Puzzle";

    return (
        <div className="w-full">

            <HangmanStatsModal open={showStats} onClose={() => setShowStats(false)} />
            <HangmanRulesModal open={showRules} onClose={() => setShowRules(false)} title="Hangman Rules" />
            <GameBar
                backHref={'/hangman/daily'}
                context={
                    { title: "Hangman", subtitle, mode }
                }
                onOpenRules={() => setShowRules(true)}
                onOpenStats={() => setShowStats(true)}
                // onShare={onShare}
            />
            {children}

        </div>
    );
}
