"use client";
import React, { useEffect, useState } from 'react';
import GameBar from '../appComponents/GameBar';
import WurpleClient from './WurpleClient';
import RulesModal from './components/RulesModal';
import { WurpleMode } from './helpers/types';
import StatsModal from './components/StatsModal';
import { loadStats } from './helpers/statsStore';

export const WurpleClientContainer: React.FC<{ initialDaily: any }> = ({ initialDaily }) => {
    const [rulesOpen, setRulesOpen] = useState(false); 
  const [mode, setMode] = useState<WurpleMode>(initialDaily.mode ?? "easy");
  const [statsOpen, setStatsOpen] = useState(false);

  const [statsMode, setStatsMode] = useState<"easy" | "challenge">("easy");
const [stats, setStats] = useState<ReturnType<typeof loadStats> | null>(null);

useEffect(() => {
  setStats(loadStats());
}, []);

    return (
        <div className="flex flex-col">
            <GameBar
                    backHref="/"
                    context={{ title: "Wurple", subtitle: "Today's Puzzle", mode }}
                    onOpenRules={() => setRulesOpen(true)}
                    // onShare={() => doShare()}
                    onOpenStats={() => setStatsOpen(true)}
                    />
            <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
            <StatsModal
                open={statsOpen}
                onClose={() => setStatsOpen(false)}
                stats={stats!}
                mode={statsMode}
                onModeChange={setStatsMode}
                />
            <div className="flex-1 overflow-auto">
                <WurpleClient initialDaily={initialDaily} setOpenRules={setRulesOpen} setStats={setStats} mode={mode} setMode={setMode} />
            </div>
        </div>
    );
};