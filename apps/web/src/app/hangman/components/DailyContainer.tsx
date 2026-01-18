"use client";

import GameBar from "../../appComponents/GameBar";
import { useState } from "react";
import DailyHangmanClient from "../daily/DailyHangmanClient";
import { HangmanRulesModal } from "./RulesModal";
import { HangmanStatsModal } from "./HangmantStatsModal";

export function DailyContainer({instanceId, category, hint}: { instanceId: string, category: string | null, hint: string | null }) {
    const [showRules, setShowRules] = useState(false);
    const [showStats, setShowStats] = useState(false);

    return (
        <div className="w-full">

            <HangmanStatsModal open={showStats} onClose={() => setShowStats(false)} />
            <HangmanRulesModal open={showRules} onClose={() => setShowRules(false)} title="Hangman Rules" />
            <GameBar
                backHref={'/hangman/daily'}
                context={
                    { title: "Hangman", subtitle: "Daily Puzzle", mode: "daily" }
                }
                onOpenRules={() => setShowRules(true)}
                onOpenStats={() => setShowStats(true)}
                // onShare={onShare}
            />
            <DailyHangmanClient instanceId={instanceId} category={category} hint={hint} />

        </div>
    );
}
