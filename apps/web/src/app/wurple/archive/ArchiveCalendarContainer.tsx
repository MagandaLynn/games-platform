"use client";
import { useEffect, useState } from 'react';
import GameBar from '@/app/appComponents/GameBar';
import RulesModal from '../components/RulesModal';
import StatsModal from '../components/StatsModal';
import { loadStats } from '../helpers/statsStore';
import WurpleArchiveCalendar, { ArchiveMeta } from './WurpleArchiveCalendar';
type Props = {
  archiveByDate: Record<string, ArchiveMeta>;
  onSelectDate?: (dateKey: string) => void;
};
export const ArchiveCalendarContainer = ({ archiveByDate, onSelectDate }: Props) => {
    const [rulesOpen, setRulesOpen] = useState(false); 
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
                context={{ title: "Wurple", subtitle: "Archive Calendar" }}
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
        <WurpleArchiveCalendar archiveByDate={archiveByDate} onSelectDate={onSelectDate} />
          
        </div>
      </div>
    );
};