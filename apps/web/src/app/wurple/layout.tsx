"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import GameBar from "../appComponents/GameBar";
import RulesModal from "./components/RulesModal";
import StatsModal from "./components/StatsModal";
import { loadStats } from "./helpers/statsStore";

export default function WurpleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [statsMode, setStatsMode] = useState<"easy" | "challenge">("easy");
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const mode = (searchParams.get('mode') as "easy" | "challenge") || "";
    const isArchive = pathname?.includes('/wurple/archive');
    const subtitle = isArchive ? "Archive" : "Today's Puzzle";
    const stats = typeof window !== 'undefined' ? loadStats() : null;

    return (
        <div className="flex flex-col wurple-layout">
            <GameBar
                backHref="/"
                context={{ title: "Wurple", subtitle, mode }}
                onOpenRules={() => setRulesOpen(true)}
                onOpenStats={() => setStatsOpen(true)}
            />
            <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
            {stats && (
                <StatsModal
                    open={statsOpen}
                    onClose={() => setStatsOpen(false)}
                    stats={stats}
                    mode={statsMode}
                    onModeChange={setStatsMode}
                />
            )}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}