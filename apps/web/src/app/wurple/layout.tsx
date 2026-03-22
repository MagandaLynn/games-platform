"use client";

import { useState, Suspense, useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import GameBar from "../appComponents/GameBar";
import RulesModal from "./components/RulesModal";
import StatsModal from "./components/StatsModal";
import type { WurpleStatsResponse } from "./helpers/types";

function WurpleLayoutContent({ children }: { children: React.ReactNode }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [statsMode, setStatsMode] = useState<"easy" | "challenge">("easy");
    const [stats, setStats] = useState<WurpleStatsResponse | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const mode = (searchParams.get('mode')) || "";
    const isArchive = pathname?.includes('/wurple/archive');
    const subtitle = isArchive ? "Archive" : "Today's Puzzle";
    const loadStats = useCallback(async () => {
        const res = await fetch("/api/wurple/stats", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as WurpleStatsResponse;
        setStats(payload);
    }, []);

    useEffect(() => {
        if (!statsOpen) return;
        loadStats().catch(() => {
            // keep modal usable if endpoint temporarily fails
        });
    }, [statsOpen, loadStats]);

    return (
        <div className="flex flex-col wurple-layout">
            <GameBar
                backHref="/"
                context={{ title: "Wurple", subtitle, mode }}
                onOpenRules={() => setRulesOpen(true)}
                onOpenStats={() => {
                    setStatsMode(mode === "challenge" ? "challenge" : "easy");
                    setStatsOpen(true);
                }}
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

export default function WurpleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={<div className="flex flex-col wurple-layout">Loading...</div>}>
            <WurpleLayoutContent>{children}</WurpleLayoutContent>
        </Suspense>
    );
}