"use client";
import React, { useEffect, useState } from 'react';
import { WurpleMode } from '../helpers/types';
import GameBar from '@/app/appComponents/GameBar';
import RulesModal from '../components/RulesModal';
import WurpleClient from '../WurpleClient';
import Link from 'next/link';
import StatsModal from '../components/StatsModal';
import { emptyStats, loadStats, WurpleStats } from '../helpers/statsStore';

export const ArchiveGameContainer: React.FC<{ initialDaily: any, date: string }> = ({ initialDaily, date }) => {
    const [rulesOpen, setRulesOpen] = useState(false); 
  const [mode, setMode] = useState<WurpleMode>(initialDaily.mode ?? "easy");
const [statsOpen, setStatsOpen] = useState(false);
const [statsMode, setStatsMode] = useState<"easy" | "challenge">("easy");
const [stats, setStats] = useState<ReturnType<typeof loadStats> | null>(null);

useEffect(() => {
  setStats(loadStats());
}, []);
    return (
        
        <div className="flex flex-col h-screen">
            <GameBar
                backHref="/"
                context={{ title: "Wurple", subtitle: "Archived Puzzle", mode }}
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
            <div className="mx-auto w-full max-w-md px-4  flex flex-col">
        {/* Context header (lightweight) */}
        <div className="mb-4 text-center">
          <div className="uppercase text-xs tracking-widest text-text-muted">
            Archived Puzzle
          </div>

          <div className="mt-1 text-xl font-extrabold">
            {date}
          </div>

          {/* Optional upgrade pill */}
          <div className="mt-2 inline-flex items-center rounded-full bg-bg-soft px-3 py-1 text-xs font-semibold text-text-muted">
            Date: {date} • Mode: {mode}
          </div>
        </div>

            <div className="flex-1 overflow-auto">
                <WurpleClient initialDaily={initialDaily} setOpenRules={setRulesOpen} mode={mode} setMode={setMode} setStats={setStats} />
            </div>
                 {/* Bottom navigation (de-emphasized) */}
        <div className="mb-8 mt-2 flex flex-col items-center gap-3 text-sm">
          <Link
            href="/wurple"
            className="text-link underline underline-offset-4 opacity-80 hover:opacity-100 hover:text-link-hover transition"
          >
            Go to Today&apos;s Puzzle
          </Link>

          <Link
            href="/wurple/archive"
            className="text-link underline underline-offset-4 opacity-80 hover:opacity-100 hover:text-link-hover transition"
          >
            Return to Archive Calendar
          </Link>
        </div>
      </div>
        </div>
    );
};